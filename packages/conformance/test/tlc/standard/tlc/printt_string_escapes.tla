(*---
description: PrintT escapes quotes, backslashes and newlines in strings.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_string_escapes ----
EXTENDS TLC, Naturals
Test == PrintT("a\"b\\c\nd\te\ff\rg")
====

(*--- recorded
all:
  exit: 0
  transcript: '| "a\"b\\c\nd\te\ff\rg"'
---*)
