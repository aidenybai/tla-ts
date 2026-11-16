(*---
description: INSTANCE accepts a keyword module name.
ref: "tla2sany/parser/TLAplusParser.java#Instantiation"
features: [file_names]
flags: [expression]
includes: [STATE.tla]
outcome: success
---*)
---- MODULE keyword_named_module_instance ----
M == INSTANCE STATE
Test == M!FromState = 1
====

(*--- recorded
all:
  exit: 0
---*)
