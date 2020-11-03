/* eslint-disable camelcase */
import React, { useEffect, useState } from 'react'

// Libs
import axios from 'axios'
import uuid from 'react-uuid'

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
import { SearchOutlined } from '@ant-design/icons'
import Table from './Table'

const { ipcRenderer: electron } = window.require('electron')

const Default = () => {
  const { Content } = Layout
  const [form] = Form.useForm()
  const [state, setState] = useState({
    listings: [],
    loading: false,
    creditsUsed: 0,
    creditsRemaining: 0,
    amzApiKey: null
  })

  useEffect(() => {
    ;(async () => {
      const key = await electron.sendSync('amz-key')
      if (key.length === 0)
        return message.error('Error trying to get Amazon Rainforest API')
      setState(s => ({ ...s, amzApiKey: key }))
    })()
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
          asin: asin.trim()
        }
        const {
          status,
          data: {
            request_info: { credits_used, credits_remaining } = {},
            product: {
              asin: asinData,
              title,
              feature_bullets = [],
              images = []
            } = {},
            request_info: { success } = {}
          } = {}
        } = await axios.get('https://api.rainforestapi.com/request', {
          params
        })
        if (status !== 200)
          message.error(
            `Error trying to get ASIN: ${asin} (Status Code = ${status})`
          )
        if (!success)
          message.error(`Error trying to get ASIN: ${asin} (Success = false)`)

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
          description: feature_bullets.join('\n'),
          image1: images.length > 0 ? images[0].link : '',
          image2: images.length > 1 ? images[1].link : '',
          image3: images.length > 2 ? images[3].link : ''
        }
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
    } catch ({ msg }) {
      message.error({
        content: `Error on scrape() -> "${msg}"`,
        key: 'scraping',
        duration: 2
      })
    }
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
    amzApiKey
  } = state
  return (
    <Layout>
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
                    disabled={loading}
                    autoSize
                    placeholder="ASINS (one per line)"
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
                      Amazon (credits {creditsUsed}/{creditsRemaining})
                    </Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={8} className="align-items-center d-flex">
                <Button
                  loading={loading}
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => form.submit()}
                >
                  Scrape
                </Button>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Table listings={listings} loading={loading} />
              </Col>
            </Row>
          </Form>
        </Card>
      </Content>
    </Layout>
  )
}

export default Default
