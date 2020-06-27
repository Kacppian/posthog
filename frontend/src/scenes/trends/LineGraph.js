import React, { Component } from 'react'
import Chart from 'chart.js'
import PropTypes from 'prop-types'
import { operatorMap } from '~/lib/utils'
import _ from 'lodash'
import { getChartColors } from 'lib/colors'

//--Chart Style Options--//
// Chart.defaults.global.defaultFontFamily = "'PT Sans', sans-serif"
Chart.defaults.global.legend.display = false
//--Chart Style Options--//

const Annotation = require('chartjs-plugin-annotation')
Chart.plugins.register(Annotation)

export class LineGraph extends Component {
    state = {
        where: 'front',
        left: 0,
        right: 0,
        enabled: false,
    }

    chartRef = React.createRef()

    componentDidMount() {
        this.buildChart()
    }

    componentDidUpdate(prevProps) {
        if (prevProps.datasets !== this.props.datasets || prevProps.color !== this.props.color) {
            this.buildChart()
        }
    }

    processDataset = (dataset, index) => {
        const colorList = getChartColors(this.props.color || 'white')

        return {
            borderColor: colorList[index],
            backgroundColor: (this.props.type === 'bar' || this.props.type === 'doughnut') && colorList[index],
            fill: false,
            borderWidth: 1,
            pointHitRadius: 8,
            ...dataset,
        }
    }

    buildChart = () => {
        const myChartRef = this.chartRef.current.getContext('2d')
        let { datasets, labels } = this.props

        const axisLabelColor = this.props.color === 'white' ? '#333' : 'rgba(255,255,255,0.8)'
        const axisLineColor = this.props.color === 'white' ? '#ddd' : 'rgba(255,255,255,0.2)'
        const axisColor = this.props.color === 'white' ? '#999' : 'rgba(255,255,255,0.6)'

        if (typeof this.myLineChart !== 'undefined') this.myLineChart.destroy()
        const _this = this
        // if chart is line graph, make duplicate lines and overlay to show dotted lines
        datasets =
            !this.props.type || this.props.type === 'line'
                ? [
                      ...datasets.map((dataset, index) => {
                          let datasetCopy = Object.assign({}, dataset)
                          let data = [...dataset.data]
                          let labels = [...dataset.labels]
                          let days = [...dataset.days]
                          data.pop()
                          labels.pop()
                          days.pop()
                          datasetCopy.data = data
                          datasetCopy.labels = labels
                          datasetCopy.days = days
                          return this.processDataset(datasetCopy, index)
                      }),
                      ...datasets.map((dataset, index) => {
                          let datasetCopy = Object.assign({}, dataset)
                          let datasetLength = datasetCopy.data.length
                          datasetCopy.dotted = true

                          // if last date is still active show dotted line
                          if (this.props.isInProgress) {
                              datasetCopy.borderDash = [10, 10]
                          }

                          datasetCopy.data =
                              datasetCopy.data.length > 2
                                  ? datasetCopy.data.map((datum, index) =>
                                        index === datasetLength - 1 || index === datasetLength - 2 ? datum : null
                                    )
                                  : datasetCopy.data
                          return this.processDataset(datasetCopy, index)
                      }),
                  ]
                : datasets.map((dataset, index) => this.processDataset(dataset, index))

        this.myLineChart = new Chart(myChartRef, {
            type: this.props.type || 'line',
            data: {
                //Bring in data
                labels: labels,
                datasets: datasets,
            },
            options:
                this.props.type !== 'doughnut'
                    ? {
                          responsive: true,
                          maintainAspectRatio: false,
                          scaleShowHorizontalLines: false,
                          tooltips: {
                              enabled: true,
                              intersect: false,
                              mode: 'nearest',
                              bodySpacing: 5,
                              yPadding: 10,
                              xPadding: 10,
                              caretPadding: 0,
                              displayColors: false,
                              backgroundColor: '#1dc9b7',
                              titleFontColor: '#ffffff',
                              labelFontSize: 23,
                              cornerRadius: 4,
                              fontSize: 16,
                              footerSpacing: 0,
                              titleSpacing: 0,
                              callbacks: {
                                  label: function(tooltipItem, data) {
                                      let entityData = data.datasets[tooltipItem.datasetIndex]
                                      if (entityData.dotted && !(tooltipItem.index === entityData.data.length - 1))
                                          return null
                                      var label = entityData.chartLabel || entityData.label || ''
                                      if (
                                          entityData.action &&
                                          entityData.action.properties &&
                                          !_.isEmpty(entityData.action.properties)
                                      ) {
                                          label += ` (${entityData.action.properties
                                              .map(
                                                  property =>
                                                      operatorMap[property.operator || 'exact'].split(' ')[0] +
                                                      ' ' +
                                                      property.value
                                              )
                                              .join(', ')})`
                                      }

                                      return label + ' - ' + tooltipItem.yLabel.toLocaleString()
                                  },
                              },
                          },
                          hover: {
                              mode: 'nearest',
                              onHover(e) {
                                  if (_this.props.onClick) {
                                      const point = this.getElementAtEvent(e)
                                      if (point.length) e.target.style.cursor = 'pointer'
                                      else e.target.style.cursor = 'default'
                                  }
                              },
                          },
                          annotation: {
                              drawTime: 'afterDraw',
                              events: ['mouseenter'],
                              annotations: [
                                  {
                                      type: 'line',
                                      mode: 'vertical',
                                      scaleID: 'x-axis-0',
                                      value: 1,
                                      borderWidth: 2,
                                      borderColor: 'rgba(0,0,0,0.3)',
                                      label: {
                                          content: 'Test',
                                          enabled: true,
                                          position: 'top',
                                          backgroundColor: 'rgba(0,0,0,0.3)',
                                      },
                                      onMouseenter: function(e) {
                                          this.options.borderColor = 'white'
                                          this.options.label.enabled = true
                                      },
                                      onMouseleave: function(e) {
                                          this.options.borderColor = 'white'
                                      },
                                  },
                              ],
                          },
                          scales: {
                              xAxes: [
                                  {
                                      display: true,
                                      gridLines: { lineWidth: 0, color: axisLineColor, zeroLineColor: axisColor },
                                      ticks: {
                                          autoSkip: true,
                                          beginAtZero: true,
                                          min: 0,
                                          fontColor: axisLabelColor,
                                          precision: 0,
                                      },
                                  },
                              ],
                              yAxes: [
                                  {
                                      display: true,
                                      gridLines: { color: axisLineColor, zeroLineColor: axisColor },
                                      ticks: {
                                          autoSkip: true,
                                          beginAtZero: true,
                                          min: 0,
                                          fontColor: axisLabelColor,
                                          precision: 0,
                                      },
                                  },
                              ],
                          },
                          events: ['mousemove', 'click'],
                          onClick: (event, [point]) => {
                              console.log(this)
                              if (point && this.props.onClick) {
                                  const dataset = datasets[point._datasetIndex]
                                  this.props.onClick({
                                      point,
                                      dataset,
                                      index: point._index,
                                      label:
                                          typeof point._index !== 'undefined' && dataset.labels
                                              ? dataset.labels[point._index]
                                              : undefined,
                                      day:
                                          typeof point._index !== 'undefined' && dataset.days
                                              ? dataset['compare']
                                                  ? dataset.dates[point._index]
                                                  : dataset.days[point._index]
                                              : undefined,
                                      value:
                                          typeof point._index !== 'undefined' && dataset.data
                                              ? dataset.data[point._index]
                                              : undefined,
                                  })
                              }
                          },
                          onHover: evt => {
                              const leftExtent = this.myLineChart.scales['x-axis-0'].left
                              const rightExtent = this.myLineChart.scales['x-axis-0'].right
                              const ticks = this.myLineChart.scales['x-axis-0'].ticks.length
                              const delta = rightExtent - leftExtent
                              const interval = delta / (ticks - 1)

                              const index = map(evt.offsetX, leftExtent, rightExtent, 0, ticks - 1)
                              this.setState({
                                  left: (index + 1) * interval,
                              })
                          },
                      }
                    : {
                          responsive: true,
                          maintainAspectRatio: false,
                          hover: { mode: 'index' },
                      },
        })
    }

    render() {
        return (
            <div
                className="graph-container"
                data-attr={this.props['data-attr']}
                onMouseLeave={() => this.setState({ enabled: false })}
            >
                <canvas ref={this.chartRef} onMouseOver={() => this.setState({ enabled: true })} />
                {this.state.enabled && (
                    <button
                        style={{
                            position: 'absolute',
                            left: this.state.where === 'front' ? this.state.left - 25 : 335,
                            bottom: 20,
                            width: 50,
                        }}
                    >
                        HE
                    </button>
                )}
            </div>
        )
    }
}

const map = (value, x1, y1, x2, y2) => Math.round(((value - x1) * (y2 - x2)) / (y1 - x1) + x2)

LineGraph.propTypes = {
    datasets: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string, count: PropTypes.number })).isRequired,
    labels: PropTypes.array.isRequired,
    options: PropTypes.object,
    type: PropTypes.string,
    onClick: PropTypes.func,
}
