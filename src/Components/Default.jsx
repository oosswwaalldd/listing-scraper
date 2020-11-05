/* eslint-disable camelcase */
import React, { useEffect, useState } from 'react'

// Libs
import axios from 'axios'
import uuid from 'react-uuid' // Libs
import $ from 'jquery'

// Components
import {
  Layout,
  Row,
  Col,
  Card,
  Form,
  Input,
  message,
  Radio,
  Button
} from 'antd'
import { SearchOutlined, SettingOutlined } from '@ant-design/icons'
import Table from './Table'
import Options from './Options'

const Default = () => {
  const { Content } = Layout
  const [form] = Form.useForm()
  const [state, setState] = useState({
    listings: [],
    loading: false,
    creditsUsed: 0,
    creditsRemaining: 0,
    amzApiKey: null,
    showOptions: false
  })

  useEffect(() => {
    if (!state.amzApiKey) setState(s => ({ ...s, showOptions: true }))
  }, [])

  /**
   * Fires the listing scraping
   * @param {Object} values Form values
   */
  const scrape = async values => {
    try {
      const asins = values.asins.split('\n')
      // Check ASINS integrity
      const haveSpaces = asins.some(i => i.split(' ').length > 1)
      if (haveSpaces)
        return message.error({
          content: 'Some of the ASINS have spaces. WTF?',
          key: 'scraping',
          duration: 5
        })

      setState(s => ({ ...s, loading: true }))
      message.loading({
        content: 'Getting product listings...',
        key: 'scraping',
        duration: 0
      })
      for (const asin of asins.filter(a => a.trim())) {
        message.loading({
          content: `Scraping ASIN: ${asin}`,
          key: 'scraping',
          duration: 0
        })

        // Make the http GET request to Rainforest API
        const params = {
          api_key: amzApiKey,
          type: 'product',
          amazon_domain: 'amazon.com',
          asin: asin.trim(),
          include_html: true
        }
        const {
          status,
          data: {
            html,
            request_info: { credits_used, credits_remaining } = {},
            product: {
              asin: asinData,
              title,
              description,
              feature_bullets = [],
              images = []
            } = {},
            request_info: { success, message: apiMessage } = {}
          } = {}
        } = await axios.get('https://api.rainforestapi.com/request', {
          params
        })
        if (status !== 200)
          throw new Error(
            `Error trying to get ASIN: ${asin} (Status Code = ${status}, Message: ${apiMessage})`
          )

        if (!success)
          throw new Error(
            `Error trying to get ASIN: ${asin} (Success = false, Message: ${apiMessage})`
          )

        message.success({
          content: `ASIN: ${asin} done!`,
          key: 'scraping',
          duration: 2
        })
        const item = {
          id: uuid(),
          asin: asinData,
          title,
          shortTitle: buildShortTitle(title),
          description: getDescription(description, html)
        }

        // Images
        let index = 1
        for (const image of images.splice(0, 3)) {
          item[`image${index}`] = image.link
          index += 1
        }

        // Feature bullets
        index = 1
        for (const bullet of feature_bullets.splice(0, 3)) {
          item[`feature${index}`] = bullet
          index += 1
        }
        console.log(item)

        setState(s => ({
          ...s,
          listings: [...s.listings, item],
          creditsUsed: credits_used,
          creditsRemaining: credits_remaining
        }))
      }
      form.resetFields()
      setState(s => ({ ...s, loading: false, asinCount: 0 }))
      message.success({
        content: 'All listings scraped',
        key: 'scraping',
        duration: 2
      })
    } catch (error) {
      const { message: msg } = error
      console.log(error)
      setState(s => ({ ...s, loading: false }))
      const _msg = `Error on scrape() -> "${msg}"`
      message.error({
        content: _msg,
        key: 'scraping',
        duration: 2
      })
    }
  }

  const getDescription = (description, html) => {
    if (description)
      return description.replace(/PRODUCT DESCRIPTION/i, '').trim()
    const _description = $(html)
      .find('#productDescription')
      .find('script')
      .remove()
    return _description
      .find('#productDescription')
      .text()
      .replace(/PRODUCT DESCRIPTION/i, '')
      .trim()
  }

  const buildShortTitle = title => {
    const _title = title ? title.trim() : ''
    if (!_title || (_title && _title.length <= 80)) return ''
    return _title
      .trim()
      .substring(0, 80)
      .trim()
  }

  const {
    listings,
    loading,
    creditsUsed,
    creditsRemaining,
    asinCount,
    amzApiKey,
    showOptions
  } = state
  return (
    <Layout>
      <Options
        amzApiKey={amzApiKey}
        visible={showOptions}
        setAmzKey={key => setState(s => ({ ...s, amzApiKey: key }))}
        close={() => setState(s => ({ ...s, showOptions: false }))}
      />
      <Content style={{ height: '100%' }}>
        <Card>
          <Form
            layout="vertical"
            onFinish={scrape}
            form={form}
            initialValues={{ source: 'amazon' }}
            onFinishFailed={() => message.warning('Please check the values')}
          >
            <Row>
              <Col span={8}>
                <Form.Item
                  className="mb-0"
                  name="asins"
                  rules={[
                    {
                      required: true,
                      message: 'This field is required.'
                    }
                  ]}
                >
                  <Input.TextArea
                    disabled={loading || !amzApiKey}
                    autoSize
                    placeholder={
                      amzApiKey
                        ? 'ASINS (one per line)'
                        : 'Amazon Rainforest API Key is REQUIRED!'
                    }
                    allowClear
                    onChange={({ target: { value } }) =>
                      setState(s => ({
                        ...s,
                        asinCount: value.split('\n').length
                      }))
                    }
                  />
                </Form.Item>
                <span>{asinCount || 0} ASINS</span>
              </Col>
              <Col
                span={8}
                className="justify-content-center align-items-center d-flex"
              >
                <Form.Item name="source" className="mb-0">
                  <Radio.Group>
                    <Radio value="amazon">
                      Amazon (credits {creditsUsed}/
                      {creditsUsed + creditsRemaining})
                    </Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={6} className="align-items-center d-flex">
                <Button
                  loading={loading}
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => form.submit()}
                >
                  Scrape
                </Button>
              </Col>
              <Col span={2} className="align-items-center d-flex">
                <SettingOutlined
                  style={{ fontSize: 30 }}
                  onClick={() => setState(s => ({ ...s, showOptions: true }))}
                />
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Table listings={listings} />
              </Col>
            </Row>
          </Form>
        </Card>
      </Content>
    </Layout>
  )
}

export default Default
