const fs = require("fs");
const path = require("path");

const stepMap = {
  3220: "9b4c98a5c71f4105b73f37e76cf74b98_science_objective.html",
  3224: "73faf12ba9fc4a1ab0fe5d34d3e88ea3_payload_config.html",
  3226: "40829ff890b749169e0454cd316e1a70_inflight_mission_control.html",
  3228: "e01f469c8b834c5a9791a8c0a9d9003a_spacecraft_config.html",
  3230: "82a4d657a38042e694180838e6243223_spacecraft_body.html",
  3232: "f5d0df20a1f44b9eaee9c78c3ba67998_mission_design_overview.html",
  3234: "46c87188a28b4703acd52acb61b5dcc0_launch_vehicle.html",
  3236: "dfc535e534554dbab569aa318a691a96_propulsion_selection.html",
  3238: "fdf39a3068f9444fa2b1e0a99817f530_power_and_comms.html",
  3240: "35fcc636dafb44cd921b737cdfcf3bd5_3d_assembly.html",
  3242: "58ce5a1431c14e3dab1ee4bc64925bb2_how_to_play.html",
  3244: "a0594b61f8764610aea0729bd3c7f32d_science_payload.html"
};

const baseDir = "C:\\Users\\HYPERX\\.gemini\\antigravity\\brain\\1ecf1260-bac6-44e2-b5fe-a97d8428dbb5\\.system_generated\\steps";
const targetDir = "scratch/stitch_screens";
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

for (const [step, filename] of Object.entries(stepMap)) {
  const filePath = path.join(baseDir, step, "output.txt");
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(raw);
    if (json.html) {
      fs.writeFileSync(path.join(targetDir, filename), json.html);
      console.log("Saved", filename, "size:", json.html.length);
    }
  }
}

