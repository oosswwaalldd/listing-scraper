import React, { useState } from 'react'

// Libs
import Excel from 'exceljs'
import saveAs from 'file-saver'

// Components
import { Table, Empty, Row, Col, Button } from 'antd'
import { FileExcelOutlined } from '@ant-design/icons'

const headers = [
  { label: 'Product Title', value: 'title' },
  { label: 'Description', value: 'description' },
  { label: 'Description (Pretty)', value: 'prettyDescription' },
  { label: 'image 1', value: 'image1' },
  { label: 'image 2', value: 'image2' },
  { label: 'image 3', value: 'image3' }
]
const TableComponent = props => {
  const { listings } = props

  const [state] = useState({
    columns: [
      {
        title: 'Title',
        key: 'title',
        align: 'center',
        className: 'pointer',
        render: l => l.title
      },
      {
        title: 'Description',
        key: 'description',
        align: 'center',
        className: 'pointer',
        render: l => l.description
      },
      {
        title: 'Description (Pretty)',
        key: 'description',
        align: 'left',
        className: 'pointer',
        render: l => (
          <span
            dangerouslySetInnerHTML={{
              __html: l.description
            }}
          />
        )
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
      }
    ]
  })

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
