---
description: Apply when editing Cocos Creator 2.4 UI/layout code involving
  cc.Label text measurement.
alwaysApply: false
---

In Cocos Creator 2.4, after changing cc.Label.string or measurement-related properties, call label._forceUpdateRenderData() before reading node.width or node.height for text measurement.