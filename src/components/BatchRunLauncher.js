import React, { Component } from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { injectIntl } from 'react-intl';
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import { Paper, Grid, Divider, IconButton } from "@material-ui/core";
import SendIcon from "@material-ui/icons/Send";
import {
    formatMessage, formatMessageWithValues, FormattedMessage,
    PublishedComponent, coreConfirm, journalize
} from "@openimis/fe-core";
import { processBatch } from "../actions";

const styles = theme => ({
    paper: {
        marginBottom: theme.spacing(1)
    },
    paperHeader: theme.paper.header,
    paperHeaderTitle: theme.paper.title,
    paperHeaderAction: theme.paper.action,
    form: {
        padding: 0
    },
    item: {
        padding: theme.spacing(1)
    },
    paperDivider: theme.paper.divider,
});

class BatchRunLauncher extends Component {

    state = {
        region: null,
        district: null,
        locationStr: null,
        year: null,
        month: null,
        monthStr: null,
    }

    launchBatchRun = e => {
        this.props.coreConfirm(
            formatMessage(this.props.intl, "claim_batch", "processBatch.confirm.title"),
            formatMessageWithValues(this.props.intl, "claim_batch", "processBatch.confirm.message",
                {
                    location: this.state.locationStr || formatMessage(this.props.intl, "claim_batch", "claim_batch.regions.country"),
                    year: this.state.year,
                    month: this.state.monthStr,
                }),
        );
    }

    componentDidMount() {
        if (!!this.props.userHealthFacilityFullPath) {
            this.setState((state, props) => ({
                region: props.userHealthFacilityFullPath.location.parent,
                district: props.userHealthFacilityFullPath.location,
                locationStr: props.userHealthFacilityLocationStr,
            }))
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (!_.isEqual(prevProps.userHealthFacilityFullPath, this.props.userHealthFacilityFullPath) &&
            !!this.props.userHealthFacilityFullPath
        ) {
            this.setState((state, props) => ({
                region: props.userHealthFacilityFullPath.location.parent,
                district: props.userHealthFacilityFullPath.location,
                locationStr: props.userHealthFacilityLocationStr,
            }))
        }
        if (prevProps.confirmed !== this.props.confirmed && !!this.props.confirmed) {
            this.props.processBatch(
                this.state.district || this.state.region,
                this.state.year,
                this.state.month,
                formatMessageWithValues(this.props.intl, "claim_batch", "processBatch.mutationLabel",
                    {
                        location: this.state.locationStr || formatMessage(this.props.intl, "claim_batch", "claim_batch.regions.country"),
                        year: this.state.year,
                        month: this.state.monthStr,
                    })
            );
        } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
            this.props.journalize(this.props.mutation);
        }
    }

    canLaunch = () => !!this.state.year && !!this.state.month

    onChangeRegion = (v, s) => {
        this.setState({
            region: v,
            district: null,
            locationStr: s
        })
    }

    onChangeDistrict = (v, s) => {
        this.setState({
            region: !!v ? v.parent : null,
            district: v,
            locationStr: s
        });
    }

    render() {
        const { intl, classes } = this.props;
        const min = new Date().getFullYear() - 7;
        const max = min + 9;
        return (
            <Paper className={classes.paper}>
                <Grid container className={classes.paperHeader}>
                    <Grid item xs={11} className={classes.paperHeaderTitle}>
                        <FormattedMessage module="claim_batch" id="BatchRunLauncher.title" />
                    </Grid>
                    <Grid item xs={1}>
                        <Grid container justify="flex-end">
                            <Grid item className={classes.paperHeaderAction}>
                                <IconButton disabled={!this.canLaunch()} onClick={this.launchBatchRun}>
                                    <SendIcon />
                                </IconButton>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12}>
                        <Divider />
                    </Grid>
                    <Grid item xs={3} className={classes.item}>
                        <PublishedComponent
                            pubRef="location.RegionPicker"
                            value={this.state.region}
                            withNull={true}
                            nullLabel={formatMessage(intl, "claim_batch", "claim_batch.regions.country")}
                            onChange={this.onChangeRegion}
                        />
                    </Grid>
                    <Grid item xs={3} className={classes.item}>
                        <PublishedComponent
                            pubRef="location.DistrictPicker"
                            region={this.state.region}
                            value={this.state.district}
                            withNull={true}
                            onChange={this.onChangeDistrict}
                        />
                    </Grid>
                    <Grid item xs={3} className={classes.item}>
                        <PublishedComponent
                            pubRef="core.YearPicker"
                            module="claim_batch"
                            label="year"
                            min={min}
                            max={max}
                            withNull={false}
                            value={this.state.year}
                            required={true}
                            onChange={e => this.setState({ year: e })}
                        />
                    </Grid>
                    <Grid item xs={3} className={classes.item}>
                        <PublishedComponent
                            pubRef="core.MonthPicker"
                            module="claim_batch"
                            label="month"
                            value={this.state.month}
                            withNull={false}
                            required={true}
                            onChange={(v, s) => this.setState({ month: v, monthStr: s })}
                        />
                    </Grid>
                </Grid>
            </Paper>
        )
    }
}

const mapStateToProps = state => ({
    userHealthFacilityFullPath: !!state.loc ? state.loc.userHealthFacilityFullPath : null,
    userHealthFacilityLocationStr: !!state.loc ? state.loc.userHealthFacilityLocationStr : null,
    confirmed: state.core.confirmed,
    submittingMutation: state.claim_batch.submittingMutation,
    mutation: state.claim_batch.mutation,
});


const mapDispatchToProps = dispatch => {
    return bindActionCreators(
        { coreConfirm, processBatch, journalize },
        dispatch);
};

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(withTheme(withStyles(styles)(BatchRunLauncher))));
