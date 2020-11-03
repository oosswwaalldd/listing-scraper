import React from 'react'

import { Drawer, Row, Col, Form, Input } from 'antd'

const Options = props => {
  const { visible, close, setAmzKey, amzApiKey } = props
  return (
    <Drawer
      title="Options"
      width={'50%'}
      placement="right"
      visible={visible}
      onClose={close}
      destroyOnClose={true}
      footer={null}
    >
      <Row>
        <Col span={24}>
          <Form.Item label="Rainforest API Key">
            <Input
              value={amzApiKey}
              placeholder="Enter Rainforest API Key"
              allowClear
              onChange={({ target: { value } }) => setAmzKey(value)}
            />
          </Form.Item>
        </Col>
      </Row>
    </Drawer>
  )
}

export default Options
