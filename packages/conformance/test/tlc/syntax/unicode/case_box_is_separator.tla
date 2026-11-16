(*---
description: "□ works as the [] separator of a CASE."
ref: "tla2sany/parser/TLAplusParser.java#caseSep"
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE case_box_is_separator ----
Test == CASE FALSE -> FALSE □ TRUE -> TRUE
====

(*--- recorded
all:
  exit: 0
---*)
