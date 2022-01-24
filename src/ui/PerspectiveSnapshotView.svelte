<script lang="ts">
    import PerspectiveSnapshotGraph from './PerspectiveSnapshotGraph.svelte'

    export let perspectivesnapshot: string

    function noop(){}

</script>

<div class="perspective-snapshot-view"
    on:mousewheel|stopPropagation={noop} 
    on:touchstart|stopPropagation={noop}
    on:mouseup|stopPropagation={noop}
    on:keydown|stopPropagation
    on:keyup|stopPropagation
    on:keypress|stopPropagation
>
    <div class="header">
        <h1>
            perspective snapshot view
        </h1>
    </div>
    <div>
        <PerspectiveSnapshotGraph
            perspectivesnapshot={perspectivesnapshot}
        ></PerspectiveSnapshotGraph>
    </div>

</div>

<style>
    h1 {
        margin: 5px 20px;
        display: inline;
    }

    .header {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        height: 50px;
        background-color: #44aaee6b;
    }

    .perspective-snapshot-view {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-color: #e1f6f7db;
        padding: 20px;
    }

    .footer-panel {
        position: absolute;
        height: 200px;
        right: 0;
        bottom: 0;
        left: 0;
        transition: height 0.5s;
        z-index: 10;
    }

    .footer-header { 
        height: 42px; 
        background-color: #44aaee6b;
    }

    .footer-title {
        margin-left: 50px;
        line-height: 50px;
    }

    .tool-buttons {
        position: absolute; 
        right: 0; 
        top: 2px;
    }

    .toolbar {
        position: absolute;
        left: 0;
        top: 0;
        height: 50px;
    }

    .footer-content {
        background-color: black;
        height: 160px;
        overflow-x: scroll;
        padding-left: 10px
    }

    .side-panel {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 400px;
        padding-left: 50px;
        transition: width 0.5s;
        background-color: white;
        overflow-x: hidden;
        z-index: 10;
    }

    .side-panel-handle {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        width: 50px;
        background-color: darkslateblue;
        line-height: 95vh;
        color: white;
        font-weight: bold;
    }

    .side-header {
        position: relative;
    }

    .side-content {
        position: relative;
    }

    .picker {
        cursor: crosshair;
    }

    .invisible {
        display: none;
    }

    .visible {
        display: block;
    }
</style>
