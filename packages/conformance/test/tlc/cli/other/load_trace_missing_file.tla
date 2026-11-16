(*---
description: -loadTrace on a file that doesn't exist fails inside the generated constraint, when Json's deserialize runs.
ref: tlc2/module/Json.java#deserialize
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
args:
  - -loadTrace
  - json
  - no_such_trace.json
---*)
---- MODULE load_trace_missing_file ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    x = 0
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    no_such_trace.json (No such file or directory)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 13 in load_trace_missing_file
    1. Line 41, column 5 to line 66, column 60 in _JsonTrace
    2. Line 59, column 8 to line 66, column 60 in _JsonTrace
    3. Line 59, column 8 to line 59, column 29 in _JsonTrace
    4. Line 59, column 18 to line 59, column 29 in _JsonTrace
    5. Line 59, column 25 to line 59, column 29 in _JsonTrace
    6. Line 49, column 18 to line 49, column 58 in _JsonTrace
    7. Line 49, column 18 to line 49, column 49 in _JsonTrace
    8. Line 49, column 18 to line 49, column 31 in _JsonTrace
    9. Line 26, column 25 to line 26, column 60 in _JsonTrace
    2199:0 1 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
