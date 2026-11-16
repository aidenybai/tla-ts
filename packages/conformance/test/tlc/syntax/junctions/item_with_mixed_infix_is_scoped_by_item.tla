(*---
description: "An infix in one item does not conflict with bullets, since each item is its own expression."
ref: "tla2sany/parser/TLAplusParser.java#JuncItem"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE item_with_mixed_infix_is_scoped_by_item ----
Test ==
  \/ TRUE /\ FALSE
  \/ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
