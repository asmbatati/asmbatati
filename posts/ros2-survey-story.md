## Why a survey, and why now

Robotics middleware moves fast. ROS 2 went from a rewrite people were skeptical about to the default for serious autonomy in a few short years. Pulling that story together — the architecture, DDS, real-time, security, the tooling — into one reference felt overdue.

This space is now a real markdown blog: each post is a `.md` file under `posts/`, indexed by `posts/posts.json`. To publish a note straight from the Obsidian vault, run:

```bash
python tools/publish_post.py "G:\My Drive\Notes\Obsidian\<your-note>.md"
```

The script strips vault frontmatter and wikilinks, computes the read time, and registers the post — then it renders here.

## How I'd structure the next one

Lead with the question, not the method. Show one result early. Keep the prose tight and let the figures carry the weight — the same rules I use for papers.
