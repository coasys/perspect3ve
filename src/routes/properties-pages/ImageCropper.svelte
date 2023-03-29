<script>
	import Cropper from "svelte-easy-crop";
	import getCroppedImg from "./canvasUtils";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

	let crop = { x: 0, y: 0 };
	let zoom = 1;
	let image, fileinput, pixelCrop, croppedImage;

	function onFileSelected(e) {
	  let imageFile = e.target.files[0];
	  let reader = new FileReader();
	  reader.onload = e => {
	    image = e.target.result;
	  };
	  reader.readAsDataURL(imageFile);
	}

	let profilePicture, style;

	function previewCrop(e) {
	  pixelCrop = e.detail.pixels;
	  const { x, y, width } = e.detail.pixels;
	  const scale = 200 / width;
	  profilePicture.style = `margin: ${-y * scale}px 0 0 ${-x *
	    scale}px; width: ${profilePicture.naturalWidth * scale}px;`;
	}

	async function cropImage() {
	  croppedImage = await getCroppedImg(image, pixelCrop);
      return croppedImage
	}

	function reset() {
	  croppedImage = null;
	  image = null;
	}
</script>
{#if !image}
	<h2>
		Pelease select image file:
	</h2>
	<input type="file" accept=".jpg, .jpeg, .png" on:change={(e)=>onFileSelected(e)} bind:this={fileinput} >

{:else}
	<h2>
        Crop your image:
    </h2>
	<div style="position: relative; width: 100%; height: 300px;">
		<Cropper
			{image}
			bind:crop 
            bind:zoom
			on:cropcomplete={previewCrop}
			aspect={1}
		/>
	</div>
	<h2>Preview</h2>
	<div class="prof-pic-wrapper">
		<img
			bind:this={profilePicture}
			class="prof-pic"
			src={image}
			alt="Profile example"
			{style}
		/>
	</div>
	<j-flex gap="400">
		<j-button 
			size="lg" 
			on:click={() => dispatch('cancel')}
		>
			Cancel
		</j-button>

		<j-button 
			variant="primary" 
			size="lg" 
			on:click={async () => {
                const croppedImage = await cropImage();
				image = null;
                console.log("croppedImage", croppedImage)
                dispatch('cropped', croppedImage);
            }}
		>
			Set Background
		</j-button>
	  </j-flex>
{/if}

<style>
  .prof-pic-wrapper {
    height: 200px;
    width: 200px;
    position: relative;
    border: solid;
    overflow: hidden;
  }

  .prof-pic {
    position: absolute;
  }
</style>