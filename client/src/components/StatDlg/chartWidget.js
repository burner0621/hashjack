import React, { useEffect, useState } from 'react';
import { PieChart, pieChartDefaultProps, PieChartProps } from 'react-minimal-pie-chart';

function CustomPieChart() {
    const [hovered, setHovered] = useState(undefined);
    const [randomDelta, setRandomDelta] = useState(0.02);

    useEffect(() => {
        let randDel = Math.random();
        setRandomDelta(randDel);
    }, []);

    var data = [
        { title: 'Loss Percentage', value: 50.04 + Number(randomDelta), color: 'red', key: "Loss Percentage" },
        { title: 'Win Percentage', value: 49.96 - Number(randomDelta), color: 'green', key: "Win Percentage" },
    ].map((entry, i) => {
        if (hovered === i) {
            return {
                ...entry,
                color: 'black',
            };
        }
        return entry;
    });

    const lineWidth = 50;

    return (
        <div className="overflow-x-auto text-white block sm:flex justify-center  w-full border-t-0 border-2 border-white  flex-col ">
            <div className="flex w-full justify-between px-10 pt-5 pb-0 mb-0">
                <div className="text-light text-xl text-[#8b1832]">{`Win Rate: ${Number(49.96 - Number(randomDelta)).toFixed(2)}%`}</div>
                <div className="text-light text-xl text-[#8b1832]">{`Loss Rate: ${Number(50.04 + Number(randomDelta)).toFixed(2)}%`}</div>
            </div>
            <PieChart
                className="p-3 rotate-60"
                style={{
                    fontFamily:
                        '"Nunito Sans", -apple-system, Helvetica, Arial, sans-serif',
                    fontSize: '8px',
                }}
                data={data}
                radius={pieChartDefaultProps.radius - 6}
                lineWidth={60}
                segmentsStyle={{ transition: 'stroke .3s', cursor: 'pointer' }}
                segmentsShift={(index) => 1}
                animate
                label={({ dataEntry }) => dataEntry.percentage.toFixed(2) + '%'}
                labelPosition={100 - lineWidth / 2}
                labelStyle={{
                    fill: '#fff',
                    opacity: 0.75,
                    pointerEvents: 'none',
                }}
                onClick={(_, index) => {
                    // setSelected(index === selected ? undefined : index);
                }}
                onMouseOver={(_, index) => {
                    setHovered(index);
                }}
                onMouseOut={() => {
                    setHovered(undefined);
                }}
            />
        </div>
    );
}

export default CustomPieChart;