import React, { useState, useEffect } from 'react'
import moment from 'moment'
import { annotationsLogic } from './annotationsLogic'
import { useValues, useActions } from 'kea'
import { AnnotationMarker } from './AnnotationMarker'
import _ from 'lodash'
import { determineDifferenceType } from '~/lib/utils'

export const Annotations = React.memo(function Annotations({
    dates,
    labeledDays,
    leftExtent,
    interval,
    topExtent,
    dashboardItemId,
}) {
    const [groupedAnnotations, setGroupedAnnotations] = useState({})
    const [diffType, setDiffType] = useState(determineDifferenceType(dates[0], dates[1]))
    const { annotationsList } = useValues(annotationsLogic({ pageKey: dashboardItemId ? dashboardItemId : null }))

    const { createAnnotation, createAnnotationNow, deleteAnnotation } = useActions(
        annotationsLogic({ pageKey: dashboardItemId ? dashboardItemId : null })
    )

    useEffect(() => {
        // calculate groups
        setDiffType(determineDifferenceType(dates[0], dates[1]))
        let groupedResults = _.groupBy(annotationsList, annote => moment(annote['date_marker']).startOf(diffType))
        setGroupedAnnotations(groupedResults)
    }, [annotationsList, dates])

    const markers = []
    dates.forEach((date, index) => {
        const annotations = groupedAnnotations[moment(date).startOf(diffType)]
        if (annotations) {
            markers.push(
                <AnnotationMarker
                    label={labeledDays[index]}
                    key={index}
                    left={index * interval + leftExtent - 12.5}
                    top={topExtent}
                    annotations={annotations}
                    onCreate={input => {
                        dashboardItemId
                            ? createAnnotationNow(input, dates[index])
                            : createAnnotation(input, dates[index])
                    }}
                    onDelete={id => deleteAnnotation(id)}
                ></AnnotationMarker>
            )
        }
    })
    return markers
})
