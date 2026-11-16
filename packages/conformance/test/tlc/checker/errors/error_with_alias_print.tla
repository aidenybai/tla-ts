(*---
description: "An error in Next from an initial state prints that state without applying the ALIAS. This is a TLC bug: TLCTrace.printTrace skips evalAlias when the trace is one initial state, though it applies it otherwise."
ref: tlc2/tool/ModelChecker.java#doNext
features:
  - tlc-bug
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  ALIAS A
correct:
  all:
    exit: 255
    transcript: |-
      2190:0 Finished computing initial states: 1 distinct state generated at <date>.
      2179:1 The second argument of \div is 0.
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      p = 0
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 31, column 9 to line 31, column 21 in error_with_alias_print
      1. Line 31, column 14 to line 31, column 21 in error_with_alias_print
      2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
      2194:0 The depth of the complete state graph search is 1.
---*)
---- MODULE error_with_alias_print ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = 1 \div x
A == [p |-> x]
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 31, column 9 to line 31, column 21 in error_with_alias_print
    1. Line 31, column 14 to line 31, column 21 in error_with_alias_print
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
