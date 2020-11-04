import React, { useState, useEffect } from 'react'

// Libs
import Excel from 'exceljs'
import saveAs from 'file-saver'

// Components
import { Table, Empty, Row, Col, Button } from 'antd'
import { FileExcelOutlined } from '@ant-design/icons'

const headers = [
  { label: 'ASIN', value: 'asin' },
  { label: 'Product Title', value: 'title' },
  { label: 'Product Title (Short)', value: 'shortTitle' },
  { label: 'Description', value: 'description' },
  { label: 'Feature 1', value: 'feature1' },
  { label: 'Feature 2', value: 'feature2' },
  { label: 'Feature 3', value: 'feature3' },
  { label: 'Image 1', value: 'image1' },
  { label: 'Image 2', value: 'image2' },
  { label: 'Image 3', value: 'image3' }
]
const TableComponent = props => {
  const { listings, loading } = props

  const [state, setState] = useState({
    columns: []
  })

  useEffect(() => {
    const cols = [
      {
        title: 'ASIN',
        key: 'asin',
        align: 'center',
        className: 'pointer',
        render: l => l.asin
      },
      {
        title: 'Title',
        key: 'title',
        align: 'center',
        className: 'pointer',
        render: l => l.title
      },
      {
        title: 'Title (Short)',
        key: 'titleShort',
        align: 'center',
        className: 'pointer',
        render: l => l.titleShort
      },
      {
        title: 'Description',
        key: 'description',
        align: 'center',
        className: 'pointer',
        render: l => l.description
      },
      {
        title: 'Image 1',
        key: 'image1',
        align: 'left',
        className: 'pointer',
        render: l => l.image1
      },
      {
        title: 'Image 2',
        key: 'image2',
        align: 'left',
        className: 'pointer',
        render: l => l.image2
      },
      {
        title: 'Image 3',
        key: 'image3',
        align: 'left',
        className: 'pointer',
        render: l => l.image3
      },
      {
        title: 'Feature 1',
        key: 'feature1',
        align: 'left',
        className: 'pointer',
        render: l => l.feature1
      },
      {
        title: 'Feature 2',
        key: 'feature2',
        align: 'left',
        className: 'pointer',
        render: l => l.feature2
      },
      {
        title: 'Feature 3',
        key: 'feature3',
        align: 'left',
        className: 'pointer',
        render: l => l.feature3
      }
    ]
    setState(s => ({ ...s, columns: cols }))
  }, [listings])

  /**
   * Exports data
   */
  const exportToExcel = async () => {
    const workbook = new Excel.Workbook()
    const worksheet = workbook.addWorksheet('Assessments')

    worksheet.columns = headers.map(({ label, value }) => ({
      header: label,
      key: value
    }))

    for (const key in listings) {
      const row = listings[key]
      worksheet.addRow(row)
    }

    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(
      new Blob([buffer], { type: 'application/octet-stream' }),
      `Listings.xlsx`
    )
  }

  const { columns } = state
  return (
    <>
      <Row className="mt-2">
        <Col span={12} className="font-size-large text-left m-b-5">
          {listings.length} listings in the table
        </Col>
        <Col span={12} className="font-size-large text-right m-b-5">
          <Button
            shape="circle"
            type="dashed"
            disabled={loading}
            icon={<FileExcelOutlined />}
            onClick={exportToExcel}
          />
        </Col>
      </Row>
      <Table
        dataSource={listings}
        columns={columns}
        locale={{
          emptyText: <Empty description="No Listings to Show" />
        }}
        rowKey="id"
        size={'medium'}
        bordered={true}
      />
    </>
  )
}

export default TableComponent
