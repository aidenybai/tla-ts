(*---
description: "A module may be named with a keyword, as module names take field-name tokens."
ref: "tla2sany/parser/TLAplusParser.java#isFieldNameToken"
features: [file_names]
flags: [expression]
includes: [STATE.tla]
outcome: success
---*)
---- MODULE keyword_named_module_on_disk ----
EXTENDS STATE
Test == FromState = 1
====

(*--- recorded
all:
  exit: 0
---*)
