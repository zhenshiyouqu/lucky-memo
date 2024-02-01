import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {Button, Col, DatePicker, Flex, Form, Input, List, Modal, Popover, Radio, Row, Space} from "antd";
import styled from "styled-components";
import TextArea from "antd/es/input/TextArea";
import dayjs from "dayjs";
import {memoListLogStore, myNotifier, remote} from "../public/global";

const memoListLogInit = memoListLogStore.get("memoListLog") || [];


const MainBoardContainer = styled.div`
    padding: 10px 20px;
`;
const ele = window.electron;
const MemoTitle = styled.h3`
    text-decoration: ${props => props.isDone ? 'line-through' : 'none'};
    color: ${props => props.isDone ? 'gray' : 'black'};
`;

const ListItem = styled(List.Item)`
    //悬浮时显示删除按钮

    &:hover {
        background-color: #bebebd;
    }
`;

const MainBoard = props => {
    const [isNewOpen, setIsNewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [EditContent, setEditContent] = useState({});
    // const [memoList, setMemoList] = useState([]);
    const [newForm] = Form.useForm();
    const [memoListLog, setMemoListLog] = useState(memoListLogInit);
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const updateMemoListLog = (currentMemoList) => {
        const notDoneItems = currentMemoList.filter(item => !item.isDone);
        const doneItems = currentMemoList.filter(item => item.isDone);
        setMemoListLog([...notDoneItems, ...doneItems]);
    }
    //对memoList进行排序，isDone为false的排在前面
    useEffect(() => {
        //关闭窗口时保存数据
        remote.getCurrentWindow().on('hide', () => {
            memoListLogStore.set("memoListLog", memoListLog);
        });
        updateMemoListLog(memoListLog);
    }, []);

    useEffect(() => {
        //每次memoListLog变化，都需要重新设定定时提醒
        memoListLog.forEach(item => {
            if (item.hasClock) {
                setClockNotification(item);
            }
        });
    }, [memoListLog]);

    const setClockNotification = (item) => {
        //根据data中的clockTime设置定时提醒
        const now = new dayjs();
        const clockTime = dayjs(item.clockTime);
        const timeDiff = clockTime.diff(now);
        //如果时间差小于0，不设置提醒
        if (timeDiff < 0) {
            return;
        }
        //如果已经做完了，不设置提醒
        if (item.isDone) {
            return;
        }
        //如果item中已经有timeId，清除定时器
        if (item.timeId !== undefined) {
            clearTimeout(item.timeId);
            console.log("已经清除一个定时器" + item.timeId);
        }
        //设置定时器
        const timeId = setTimeout(() => {
            myNotifier.notify(
                {
                    title: item.title,
                    message: item.content,
                    sound: true, // Only Notification Center or Windows Toasters
                    wait: true // Wait with callback, until user action is taken against notification, does not apply to Windows Toasters as they always wait or notify-send as it does not support the wait option
                },
                function (err, response, metadata) {
                    // Response is response from notification
                    // Metadata contains activationType, activationAt, deliveredAt
                }
            );
        }, timeDiff);
        console.log("已经设置一个定时器" + timeId+";提醒时间为"+item.clockTime);
        //给item添加timeId
        item.timeId = timeId;
    }

    const saveMemoListLog = (data) => {
        memoListLogStore.set("memoListLog", data);
    }

    return (
        <MainBoardContainer>
            <List
                size="middle"
                header={
                    <Row>
                        <Col span={12}>
                            <Space>
                                <Button type="primary" size="large" onClick={
                                    () => {
                                        setIsNewOpen(true);
                                    }
                                }
                                >新备忘</Button>
                                <Button type="default" size="large" onClick={
                                    () => {
                                        remote.getCurrentWindow().reload();
                                    }
                                }
                                >刷新</Button>
                                <Button type="default" size="large" onClick={
                                    () => {
                                        setSelectedDate(dayjs().format('YYYY-MM-DD'));
                                    }
                                }
                                >今日</Button>
                                {/*<Button type="default" size="large" onClick={*/}
                                {/*    () => {*/}
                                {/*        myNotifier.notify(*/}
                                {/*            {*/}
                                {/*                title: 'My awesome title',*/}
                                {/*                message: 'Hello from node, Mr. User!',*/}
                                {/*                sound: true, // Only Notification Center or Windows Toasters*/}
                                {/*                wait: true // Wait with callback, until user action is taken against notification, does not apply to Windows Toasters as they always wait or notify-send as it does not support the wait option*/}
                                {/*            },*/}
                                {/*            function (err, response, metadata) {*/}
                                {/*                // Response is response from notification*/}
                                {/*                // Metadata contains activationType, activationAt, deliveredAt*/}
                                {/*            }*/}
                                {/*        );*/}
                                {/*    }*/}
                                {/*}*/}
                                {/*>Test</Button>*/}
                            </Space>
                        </Col>
                        <Col span={12}>
                            <Flex justify="center" align="center">
                                <Button type="default" size="small" onClick={() => {
                                    const date = dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD');
                                    setSelectedDate(date);
                                    // updateMemoList(date);
                                }}>前一天</Button>
                                <h4>日期:{selectedDate}</h4>
                                <Button type="default" size="small" onClick={() => {
                                    const date = dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD')
                                    //如果date大于今天的日期，不更新
                                    if (dayjs(date).isAfter(dayjs())) {
                                        return;
                                    }
                                    setSelectedDate(date);
                                    // updateMemoList(date);
                                }}
                                >后一天</Button>
                            </Flex>
                        </Col>
                    </Row>
                }
                dataSource={memoListLog.filter(item => item.createAt === selectedDate)}
                renderItem=
                    {
                        (item) =>
                            <ListItem
                                actions={[<a style={{fontSize: "15px"}} key="list-loadmore-more" onClick={(event) => {
                                    const updatedMemoListLog = memoListLog.map(itemTemp => {
                                        // 当找到相应的id时，返回一个新对象，其余返回原对象
                                        return itemTemp.id === item.id
                                            ? {...itemTemp, isDone: !itemTemp.isDone}
                                            : itemTemp;
                                    });
                                    updateMemoListLog(updatedMemoListLog);
                                    saveMemoListLog(updatedMemoListLog);
                                }}>
                                    {item.isDone ? '重置' : '完成'}
                                </a>, <a key="list-loadmore-edit" onClick={
                                    () => {
                                        setIsEditOpen(true);
                                        setEditContent(item);
                                    }
                                }>编辑</a>,
                                    <a key="list-loadmore-more" onClick={() => {
                                        console.log(memoListLog);
                                        // 物理删除
                                        const updatedMemoListLog = memoListLog.filter(itemTemp => {
                                            // 当找到相应的id时，返回一个新对象，其余返回原对象
                                            return itemTemp.id !== item.id;
                                        });
                                        console.log(updatedMemoListLog);
                                        updateMemoListLog(updatedMemoListLog);
                                        saveMemoListLog(updatedMemoListLog);
                                    }}>删除</a>]}
                            >
                                <Popover content={item.content} title={item.title} trigger="hover">
                                    <MemoTitle isDone={item.isDone}>{item.title}</MemoTitle>
                                </Popover>
                            </ListItem>
                    }
            />
            <Modal title="新建备忘" open={isNewOpen} onCancel={() => {
                setIsNewOpen(false);
            }}
                   footer={null}
            >
                <Form
                    form={newForm}
                    labelCol={{span: 3}}
                    wrapperCol={{span: 20}}
                    onFinish={(values) => {
                        console.log(values);
                        if (values.hasClock) {
                            values.clockTime = values.clockTime.format('YYYY-MM-DD HH:mm:ss');
                        } else {
                            values.clockTime = '';
                        }
                        let memoListLogTemp = memoListLog;
                        memoListLogTemp.push({
                            id: memoListLog.length + 1,
                            ...values,
                            createAt: dayjs().format('YYYY-MM-DD'),
                            isDone: false,
                        });
                        updateMemoListLog(memoListLogTemp);
                        newForm.resetFields();
                        setIsNewOpen(false);
                        saveMemoListLog(memoListLogTemp);
                    }}
                    initialValues={{
                        remember: false,
                    }}
                    autoComplete="off"
                >
                    <Form.Item name="title" label="主要">
                        <Input/>
                    </Form.Item>
                    <Form.Item name="content" label="详细">
                        <TextArea rows={4}/>
                    </Form.Item>
                    <Form.Item name="hasClock" label="定时提醒">
                        <Radio.Group>
                            <Radio value={true}>是</Radio>
                            <Radio value={false}>否</Radio>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item name="clockTime" label="提醒时间">
                        <DatePicker  showTime/>
                    </Form.Item>
                    <Form.Item name="repeat" label="重复">
                        <Radio.Group>
                            <Radio value="everyday">每天</Radio>
                            <Radio value="everyweek">每两天</Radio>
                            <Radio value="everymonth">每个工作日</Radio>
                            <Radio value="everyyear">每周</Radio>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">保存</Button>
                    </Form.Item>
                </Form>
            </Modal>
            <Modal title="Basic Modal" open={isEditOpen} onOk={() => {
                let memoListLogTemp = memoListLog;
                memoListLogTemp.forEach((item) => {
                        if (item.id === EditContent.id) {
                            item.title = EditContent.title;
                            item.content = EditContent.content;
                        }
                    }
                );
                setMemoListLog(memoListLogTemp);
                setIsEditOpen(false);
                saveMemoListLog(memoListLogTemp);
            }}
                   onCancel={() => {
                       setIsEditOpen(false);
                   }}
            >
                <h2 contentEditable={true} onInput={(event) => {
                    console.log(event.target.innerHTML);
                    setEditContent({
                        ...EditContent,
                        title: event.target.innerHTML,
                    });
                }} style={{}}>{EditContent.title}</h2>
                <p contentEditable={true}>{EditContent.content}</p>
            </Modal>
        </MainBoardContainer>
    );
};

MainBoard.propTypes = {};

export default MainBoard;
