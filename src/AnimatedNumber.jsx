/* @flow */
import React, {Component, PropTypes} from 'react';
import raf from 'raf';

const ANIMATION_DURATION: number = 300;

type AnimatedNumberProps = {
    component: any,
    formatValue: ?(n: number) => string,
    value: number,
    duration: ?number,
    frameStyle: ?(perc: number) => Object | void,
    stepPrecision: ?number,
    style: any
};

export default class AnimatedNumber extends Component {

    totalFrames: number;
    tweenStep: number;
    tweenHandle: number;
    state: {
        currentValue: number;
        frame: number;
    };
    props: AnimatedNumberProps;



    static propTypes = {
        component: PropTypes.any,
        formatValue: PropTypes.func,
        value: PropTypes.number.isRequired,
        duration: PropTypes.number,
        frameStyle: PropTypes.func,
        stepPrecision: PropTypes.number,
        style: PropTypes.object
    }

    static defaultProps = {
        component: 'span',
        formatValue: n => n,
        duration: ANIMATION_DURATION,
        frameStyle: () => ({})
    }

    constructor() {
        super();
        this.state = {
            currentValue: 0
        };
    }

    componentDidMount() {
        this.prepareTween(this.props);
    }

    componentWillReceiveProps(nextProps: AnimatedNumberProps) {

        if (this.state.currentValue === nextProps.value) {
            return;
        }

        if (this.tweenHandle) {
            this.endTween();
        }

        this.prepareTween(nextProps);
    }

    componentWillUnmount() {
        this.endTween();
    }

    prepareTween() {
        this.tweenHandle = raf((timestamp) => {
            this.tweenValue(timestamp, true);
        });

    }

    endTween() {
        raf.cancel(this.tweenHandle);
        this.setState({
            ...this.state,
            currentValue: this.props.value
        });
    }

    tweenValue(timestamp, start) {

        const {value, duration} = this.props;

        const {currentValue} = this.state;
        const currentTime = timestamp;
        const startTime = start ? timestamp : this.state.startTime;
        const fromValue = start ? currentValue : this.state.fromValue;

        let newValue;

        if (currentTime - startTime >= duration) {
            newValue = value;
        } else {
            newValue = fromValue + (
                (value - fromValue) * ((currentTime - startTime) / duration)
            );
        }

        if (newValue === value) {
            this.endTween();
            return;
        }

        this.setState({
            currentValue: newValue,
            startTime: startTime ? startTime : currentTime,
            fromValue, currentTime
        });
        this.tweenHandle = raf(this.tweenValue.bind(this));
    }

    render() {
        const {formatValue, value, frameStyle, stepPrecision} = this.props;
        const {currentValue, fromValue} = this.state;

        let {style} = this.props;
        let adjustedValue: number = currentValue;
        const direction = value - fromValue;

        if (currentValue !== value) {
            if (stepPrecision > 0) {
                adjustedValue = Number(currentValue.toFixed(stepPrecision));
            } else if (direction < 0 && stepPrecision === 0) {
                adjustedValue = Math.floor(currentValue);
            } else if (direction > 0 && stepPrecision === 0) {
                adjustedValue = Math.ceil(currentValue);
            }
        }

        const perc = Math.abs((adjustedValue - fromValue) / (value - fromValue) * 100);

        const currStyle: (Object | null) = frameStyle(perc);

        if (style && currStyle) {
            style = {
                ...style,
                ...currStyle
            };
        } else if (currStyle) {
            style = currStyle;
        }

        return React.createElement(
            this.props.component,
            {...this.props, style},
            formatValue(adjustedValue)
        );
    }


}
