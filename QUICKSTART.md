# Quick Start Guide

Get started with Habit Playlists in 5 minutes.

## First Time Setup

### 1. Access the App
Visit: `https://[username].github.io/habit-playlist/`

### 2. Understand the Interface

**Today Tab** - Your main workspace
- 🌅 **Morning** - Start your day activities
- 🌤️ **Midday** - Afternoon tasks
- 🌙 **Evening** - Wind down routines

**Schedule Tab** - See your upcoming 3 weeks

**Settings (⚙️)** - Theme, language, import/export
**Edit Mode** - In Schedule, toggle ✏️ Edit Schedule to manage items

### 3. Try Your First Playlist

1. Click **Morning** (or Evening)
2. Review the items in your playlist
3. Click **Start All** to begin
4. Complete each item:
   - ⏱️ **Timer items**: Click "Start Timer", it auto-advances when done
   - ✓ **Check items**: Click "Mark Done"
   - 🔗 **Link items**: Opens in new tab, click "Mark Done" when finished
   - 📝 **Note items**: Read and click "Mark Done"

## Understanding Playlists vs Schedule

### Base Playlists
Default items that appear every day in each slot (morning/midday/evening).

### Schedule Rules
Modify playlists based on:
- **Weekdays**: "Add piano practice on Tuesday evenings"
- **Intervals**: "Add reading every 3 days"

**Result**: Each day's playlist = Base playlist + Schedule rules for that day

## Customizing Your Schedule

You can edit items and basic schedules in-app. For bulk edits:

1. **Export** your program (Settings → Export Program)
2. **Edit** the JSON in your favorite editor
3. **Import** the updated program

### Example: Add a New Activity

Tell your AI assistant:
```
Add a "morning meditation" timer (10 minutes) to run every day in the morning slot.
```

The AI will add it to your JSON, then you import it.

## Item Types Explained

### Timer ⏱️
**Use for**: Timed activities like exercise, meditation, practice sessions
- Automatically advances to next item when time expires
- Optional completion sound
- Duration in seconds (600 = 10 minutes)

### Check ✓
**Use for**: Simple yes/no tasks
- Quick completion tracking
- Example: "Floss teeth", "Drink water"

### Link 🔗
**Use for**: External apps or websites
- Opens in new tab
- Mark as done when you're finished with the external activity
- Example: Posture coach app, Google Keep, training sites

### Note 📝
**Use for**: Reminders or instructions
- Display text content
- Mark done after reading/completing

## Tips for Success

### 1. Start Small
Don't add too many items at once. Start with 3-5 items per slot.

### 2. Use External Tools
Link to specialized apps (like posture-coach, voice-coach) rather than duplicating their functionality.

### 3. Leverage One-Off Items
Set `"oneOff": true` for tasks that should disappear after completion (like setup tasks or one-time purchases).

### 4. Schedule Strategically
- Daily basics → Base playlists
- Weekly variations → Schedule rules with weekdays
- Periodic tasks → Schedule rules with intervals

### 5. Review Weekly
Use Sunday evening to review your Keep/TODO lists and plan the week ahead.

## Common Workflows

### Morning Routine
1. Click **Morning**
2. Click **Start All**
3. Complete posture routine (link opens)
4. Complete voice routine (link opens)
5. Complete PM setup (link opens)
6. Done! ✅

### Evening Routine
1. Click **Evening**
2. See today's scheduled items (varies by day)
3. Start All or pick individual items
4. End with floss teeth

### Weekly Planning (Sunday)
1. Click **Evening**
2. Complete piano practice
3. Complete vocal banter
4. Review TODO lists (link to Keep)
5. Week preparation
6. Floss teeth

## Themes

Try different themes in Settings (Lo‑Fi, Animal Crossing, Transport Tycoon, Might & Magic VII, Baldur’s Gate, Minecraft, Contra, Super Mario, Red Alert, Witcher 3).

## Troubleshooting

**Q: Items aren't appearing in my schedule**
- Check that item IDs in schedule rules match items in your items object
- Verify weekday abbreviations are lowercase: "mon", "tue", etc.

**Q: How do I change my schedule?**
- Use Edit Mode in Schedule to manage items and rules
- Or Export → edit JSON → Import

**Q: Where is my data stored?**
- 100% local in browser localStorage
- Export regularly to backup

**Q: Can I use on multiple devices?**
- Export from device 1 → Import on device 2
- Or manually sync via export files

**Q: Timer not working?**
- Check if sounds are enabled (Settings → Tones)
- Make sure duration is in seconds, not minutes

## Next Steps

1. ✅ Complete your first morning routine
2. 📅 Check the Schedule tab to see upcoming days
3. 🎨 Try different themes in Settings
4. 📝 Export your program as backup
5. 🔁 Export/Import to make bulk changes

For detailed AI customization instructions, see [AI-INSTRUCTIONS.md](./AI-INSTRUCTIONS.md)

For technical details, see [README.md](./README.md)

---

**Pro Tip**: The playlist approach removes decision fatigue. You don't scan a calendar wondering what to do—you just click your slot and start. The wizard handles the rest.
