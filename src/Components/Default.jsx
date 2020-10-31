import React, { useEffect, useState } from 'react'

// Libs
import $ from 'jquery'
import uuid from 'react-uuid'

// Components
import { Layout, Row, Col, Card, Form, Input, message, Radio } from 'antd'
import Table from './Table'

const { ipcRenderer: electron } = window.require('electron')

const Default = () => {
  const { Content } = Layout
  const [form] = Form.useForm()
  const [state, setState] = useState({ listings: [] })

  /**
   * Fires the listing scraping
   * @param {Object} values Form values
   */
  const scrape = async values => {
    try {
      const { url, source } = values
      if (source === 'amazon' && !url.startsWith('https://www.amazon.com/'))
        return message.error('Link should start with "https://www.amazon.com"')
      electron.send('scrape', { url })
    } catch ({ msg }) {
      message.error(`Error on scrape() -> "${msg}"`)
    }
  }

  const buildDescription = descriptions => {
    let desc = ''
    for (const description of descriptions) {
      if (description) desc = `${desc} ${description.trim()}`
    }
    return desc
  }

  const parseListing = html => {
    const listing = $(html)
    const title = listing.find('#productTitle').text()
    let description1 = listing
      .find('#productDescription')
      .find('script')
      .remove()
    description1 = description1.find('#productDescription').html()
    let description2 = listing
      .find('#feature-bullets > ul')
      .find('script')
      .remove()
    description2 = listing
      .find('#feature-bullets > ul')
      .wrap('<p/>')
      .parent()
      .html()
    const images = []
    const imageEls = listing.find('.imgTagWrapper > img')
    for (const image of imageEls) images.push($(image).attr('src'))
    const htmlDescription = buildDescription([description1, description2])
    const prettyDescription = $(htmlDescription).text()
    return {
      id: uuid(),
      title: title.trim() || '--',
      description: htmlDescription,
      prettyDescription,
      image1: images.length > 0 ? images[0] : '',
      image2: images.length > 1 ? images[1] : '',
      image3: images.length > 2 ? images[3] : ''
    }
  }

  useEffect(() => {
    // HTML data listener
    electron.on('html', (_, data) => {
      console.log(`Data arrived (${data.length} chars)`)
      form.resetFields()
      const record = parseListing($(data))
      setState(s => ({ ...s, listings: [...s.listings, record] }))
    })
  }, [])

  const { listings } = state
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
              <Col span={24}>
                <Form.Item
                  className="mb-0"
                  name="url"
                  rules={[
                    {
                      required: true,
                      message: 'This field is required.'
                    },
                    {
                      type: 'url',
                      message: 'This field must be a valid url.'
                    }
                  ]}
                >
                  <Input.Search
                    placeholder="Listing URL"
                    enterButton="Scrape"
                    size="large"
                    loading={false}
                    onSearch={val => {
                      form.submit()
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="source">
                  <Radio.Group>
                    <Radio value="amazon">Amazon</Radio>
                  </Radio.Group>
                </Form.Item>
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
