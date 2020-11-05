import React from 'react'

import { Drawer, Row, Col, Form, Input, Button } from 'antd'

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
      <Row gutter={8}>
        <Col span={18}>
          <Form.Item label="Rainforest API Key">
            <Input
              onPressEnter={close}
              value={amzApiKey}
              placeholder="Enter Rainforest API Key"
              allowClear
              onChange={({ target: { value } }) => setAmzKey(value)}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Button type="primary" onClick={close}>
            Save & Close
          </Button>
        </Col>
      </Row>
    </Drawer>
  )
}

export default Options
