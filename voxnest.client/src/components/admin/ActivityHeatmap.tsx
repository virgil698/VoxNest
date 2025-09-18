import React, { useState } from 'react';
import { Tooltip, Button, Space } from 'antd';
import { BarChartOutlined, DotChartOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

interface HeatmapData {
  date: string;
  userCount: number;
  postCount: number;
  totalCount: number;
}

type ViewType = 'heatmap' | 'line';

interface ActivityHeatmapProps {
  data: HeatmapData[];
  title?: string;
  maxDays?: number;
  colorScheme?: 'green' | 'blue' | 'purple' | 'orange';
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  data,
  title,
  maxDays = 30,
  colorScheme = 'green'
}) => {
  const [viewType, setViewType] = useState<ViewType>('heatmap');

  // 颜色方案定义
  const colorSchemes = {
    green: {
      0: '#ebedf0',
      1: '#9be9a8', 
      2: '#40c463',
      3: '#30a14e',
      4: '#216e39'
    },
    blue: {
      0: '#ebedf0',
      1: '#9ecbff',
      2: '#0969da',
      3: '#0550ae',
      4: '#033d8b'
    },
    purple: {
      0: '#ebedf0',
      1: '#d0a9f5',
      2: '#8250df',
      3: '#6639ba',
      4: '#512a44'
    },
    orange: {
      0: '#ebedf0',
      1: '#fed7a1',
      2: '#fd8c73',
      3: '#ec6547',
      4: '#da4e2a'
    }
  };

  const colors = colorSchemes[colorScheme];

  // 获取数据映射
  const dataMap = data.reduce((acc, item) => {
    acc[item.date] = item;
    return acc;
  }, {} as Record<string, HeatmapData>);

  // 准备折线图数据
  const prepareLineChartData = () => {
    const endDate = dayjs();
    const startDate = endDate.subtract(maxDays - 1, 'day');
    
    const chartData: Array<{
      date: string;
      displayDate: string;
      userCount: number;
      postCount: number;
      totalCount: number;
    }> = [];

    for (let i = 0; i < maxDays; i++) {
      const currentDate = startDate.add(i, 'day');
      const dateStr = currentDate.format('YYYY-MM-DD');
      const dayData = dataMap[dateStr];
      
      chartData.push({
        date: dateStr,
        displayDate: currentDate.format('MM/DD'),
        userCount: dayData?.userCount || 0,
        postCount: dayData?.postCount || 0,
        totalCount: dayData?.totalCount || 0,
      });
    }

    return chartData;
  };

  // 计算强度级别（0-4）
  const getIntensity = (count: number) => {
    const maxCount = Math.max(...data.map(d => d.totalCount));
    if (count === 0) return 0;
    if (maxCount === 0) return 0;
    
    const ratio = count / maxCount;
    if (ratio <= 0.2) return 1;
    if (ratio <= 0.4) return 2;
    if (ratio <= 0.6) return 3;
    return 4;
  };

  // 生成日期网格（7行 x N列的布局）
  const generateDateGrid = () => {
    const endDate = dayjs();
    const startDate = endDate.subtract(maxDays - 1, 'day');
    
    // 计算开始日期是星期几（周一为1，周日为7）
    const getWeekday = (date: dayjs.Dayjs) => {
      const day = date.day();
      return day === 0 ? 7 : day; // 周日转换为7
    };
    
    // 找到开始周的周一
    const startWeekday = getWeekday(startDate);
    const actualStartDate = startDate.subtract(startWeekday - 1, 'day');
    
    // 计算需要多少列（周）
    const totalDays = endDate.diff(actualStartDate, 'day') + 1;
    const totalWeeks = Math.ceil(totalDays / 7);
    
    // 创建7行 x N列的网格
    const grid: Array<Array<{ date: string; data: HeatmapData | null; intensity: number; isCurrentRange: boolean }>> = [];
    
    // 初始化7行
    for (let row = 0; row < 7; row++) {
      grid[row] = [];
    }
    
    // 填充网格
    let currentDate = actualStartDate;
    for (let week = 0; week < totalWeeks; week++) {
      for (let day = 0; day < 7; day++) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        const data = dataMap[dateStr] || null;
        const isCurrentRange = currentDate.isBetween(startDate.subtract(1, 'day'), endDate.add(1, 'day'), 'day', '[]');
        const totalCount = data?.totalCount || 0;
        const intensity = isCurrentRange && totalCount > 0 ? getIntensity(totalCount) : 0;
        
        grid[day][week] = {
          date: dateStr,
          data,
          intensity,
          isCurrentRange
        };
        
        currentDate = currentDate.add(1, 'day');
      }
    }
    
    return { grid, startDate: actualStartDate, totalWeeks };
  };

  // 生成月份标签
  const generateMonthLabels = (startDate: dayjs.Dayjs, totalWeeks: number) => {
    const labels: Array<{ text: string; position: number }> = [];
    let currentDate = startDate;
    let currentMonth = '';
    
    for (let week = 0; week < totalWeeks; week++) {
      const monthStr = currentDate.format('MM月');
      if (monthStr !== currentMonth) {
        currentMonth = monthStr;
        labels.push({
          text: monthStr,
          position: week
        });
      }
      currentDate = currentDate.add(7, 'day');
    }
    
    return labels;
  };

  const { grid, startDate, totalWeeks } = generateDateGrid();
  const monthLabels = generateMonthLabels(startDate, totalWeeks);
  const lineChartData = prepareLineChartData();

  // 渲染折线图
  const renderLineChart = () => (
    <div style={{ height: '300px', marginTop: '16px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="displayDate" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#666' }}
            interval={Math.floor(lineChartData.length / 10) || 1}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#666' }}
          />
          <RechartsTooltip
            content={({ active, payload }: any) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div style={{
                    backgroundColor: 'white',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    padding: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                      {dayjs(data.date).format('YYYY年MM月DD日')}
                    </div>
                    <div style={{ marginBottom: 4, color: '#1890ff' }}>
                      总活动: {data.totalCount} 次
                    </div>
                    <div style={{ marginBottom: 4, color: '#52c41a' }}>
                      用户注册: {data.userCount} 人
                    </div>
                    <div style={{ color: '#fa8c16' }}>
                      帖子发布: {data.postCount} 篇
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line 
            type="monotone" 
            dataKey="totalCount" 
            stroke="#1890ff" 
            strokeWidth={2}
            dot={{ fill: '#1890ff', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, stroke: '#1890ff', strokeWidth: 2 }}
            name="总活动"
          />
          <Line 
            type="monotone" 
            dataKey="userCount" 
            stroke="#52c41a" 
            strokeWidth={2}
            dot={{ fill: '#52c41a', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, stroke: '#52c41a', strokeWidth: 2 }}
            name="用户注册"
          />
          <Line 
            type="monotone" 
            dataKey="postCount" 
            stroke="#fa8c16" 
            strokeWidth={2}
            dot={{ fill: '#fa8c16', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, stroke: '#fa8c16', strokeWidth: 2 }}
            name="帖子发布"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  // 渲染热度图
  const renderHeatmap = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {/* 月份标签 */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '4px', position: 'relative' }}>
        <div style={{ width: '24px' }}></div>
        {monthLabels.map((label) => (
          <div
            key={`${label.text}-${label.position}`}
            style={{
              position: 'absolute',
              left: `${32 + label.position * 18}px`,
              fontSize: '11px',
              color: '#656d76',
              fontWeight: 500
            }}
          >
            {label.text}
          </div>
        ))}
      </div>

      {/* 热度图网格 */}
      <div style={{ display: 'flex', gap: '2px', marginTop: '16px' }}>
        {/* 星期标签 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginRight: '12px' }}>
          {['一', '二', '三', '四', '五', '六', '日'].map((day, index) => (
            <div
              key={day}
              style={{
                width: '16px',
                height: '16px',
                fontSize: '11px',
                color: '#656d76',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                visibility: index % 2 === 0 ? 'visible' : 'hidden' // 只显示间隔的标签
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 网格数据 */}
        <div style={{ display: 'flex', gap: '3px' }}>
          {Array.from({ length: totalWeeks }, (_, weekIndex) => (
            <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {grid.map((dayRow, dayIndex) => {
                const dayData = dayRow[weekIndex];
                
                if (!dayData || !dayData.isCurrentRange) {
                  return (
                    <div
                      key={`empty-${dayIndex}-${weekIndex}`}
                      style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: '#ebedf0',
                        borderRadius: '3px',
                        border: '1px solid rgba(27, 31, 35, 0.06)',
                        opacity: dayData ? 0.3 : 1
                      }}
                    />
                  );
                }

                const data = dayData.data;
                const totalCount = data?.totalCount || 0;
                const userCount = data?.userCount || 0;
                const postCount = data?.postCount || 0;

                return (
                  <Tooltip
                    key={dayData.date}
                    title={
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                          {dayjs(dayData.date).format('YYYY年MM月DD日')}
                        </div>
                        <div style={{ marginBottom: 2 }}>
                          总活动: {totalCount} 次
                        </div>
                        <div style={{ marginBottom: 2 }}>
                          用户注册: {userCount} 人
                        </div>
                        <div>
                          帖子发布: {postCount} 篇
                        </div>
                      </div>
                    }
                    placement="top"
                  >
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: colors[dayData.intensity as keyof typeof colors],
                        borderRadius: '3px',
                        cursor: 'pointer',
                        border: '1px solid rgba(27, 31, 35, 0.06)',
                        transition: 'all 0.1s ease-in-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    />
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 图例 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginTop: '12px',
        fontSize: '12px',
        color: '#656d76',
        justifyContent: 'flex-end'
      }}>
        <span>少</span>
        <div style={{ display: 'flex', gap: '3px' }}>
          {Object.entries(colors).map(([level, color]) => (
            <div
              key={level}
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: color,
                borderRadius: '2px',
                border: '1px solid rgba(27, 31, 35, 0.06)'
              }}
            />
          ))}
        </div>
        <span>多</span>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '16px 0' }}>
      {/* 标题和切换按钮 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '16px' 
      }}>
        {title && (
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#24292f' }}>
            {title}
          </div>
        )}
        <Space>
          <Button
            type={viewType === 'heatmap' ? 'primary' : 'default'}
            icon={<BarChartOutlined />}
            size="small"
            onClick={() => setViewType('heatmap')}
          >
            热度图
          </Button>
          <Button
            type={viewType === 'line' ? 'primary' : 'default'}
            icon={<DotChartOutlined />}
            size="small"
            onClick={() => setViewType('line')}
          >
            折线图
          </Button>
        </Space>
      </div>

      {/* 条件渲染图表 */}
      {viewType === 'heatmap' ? renderHeatmap() : renderLineChart()}
    </div>
  );
};

export default ActivityHeatmap;
