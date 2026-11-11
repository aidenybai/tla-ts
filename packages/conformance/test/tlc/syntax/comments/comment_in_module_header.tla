(*---
description: A comment may sit between the module name and the closing dashes.
ref: "tla2sany/parser/TLAplusParser.java#BeginModule"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE comment_in_module_header (* c *) ----
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
