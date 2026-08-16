## The pattern I only saw in hindsight

I did not choose six research areas. I noticed them.

When I laid every paper, patent and working system I have shipped side by side, what I expected to see was a scatter of unrelated projects — a tracking paper here, an estimation paper there, a benchmark, a survey, a sensor kit. What I actually saw was the same six questions being asked again and again, on different vehicles, in different labs, with different funding lines attached.

That is the honest version of a research agenda. It is rarely declared in advance. It accumulates, and then one day you can name it.

## The six

{{figure}}

## Why they are really one problem

Read the six as separate specialities and they look like a lack of focus. Read them as one loop and they collapse into a single question: **how does a robot stay confident about where it is and what is happening, long enough to do something useful?**

Localization without GPS is where that question gets sharpest, because the crutch is gone. Sensor fusion is the answer at the estimator level — camera, IMU, LiDAR and terrain argued down into one best guess. SLAM is the same answer extended in space and time, so the robot's sense of place survives the trip. Reinforcement learning enters where the model runs out and the behaviour has to be learned instead of derived. Multi-robot work is what happens when you have solved it for one platform and the interesting failures move to coordination. And ROS 2 is the connective tissue that decides whether any of it survives contact with a real system.

Every one of those transitions is a place where a working single-robot demo quietly stops working. That is the part that interests me.

## What this list is not

It is not a claim to expertise in six fields. It is a map of where my open questions are, and my work is unevenly distributed across it — GPS-denied localization and state estimation carry the most published weight, and the multi-robot and RL ends are where I am still learning fastest.

It is also not fixed. The list looked different three years ago, and the doctoral work will bend it again. But when I am deciding what to read, what to review, and which collaboration to say yes to, this is the filter I use.
