(*---
description: The binary trace is written first and needs the folder to exist, so it fails with TLC_MODULE_VALUE_JAVA_METHOD_OVERRIDE, the spec's own writer then creates the folder, and the exit status stays that of the violation.
ref: tlc2/TraceExplorationSpec.java#generate
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -generateSpecTE
  - -teSpecOutDir
  - made/here/te_out.tla
---*)
---- MODULE nested_output_directory_created ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == x < 2
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 18, col 9 to line 18, col 24 of module nested_output_directory_created>
    x = 1
    2217:4 3: <Next line 18, col 9 to line 18, col 24 of module nested_output_directory_created>
    x = 2
    2154:0 Attempted to apply the operator overridden by the Java method
    public static final tlc2.value.IValue tlc2.module._TLCTrace.ioSerialize(tlc2.value.IValue,tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    made/here/te_out.bin (No such file or directory)
    2154:0 Attempted to apply the operator overridden by the Java method
    public static final tlc2.value.IValue tlc2.module._TLCTrace.ioSerialize(tlc2.value.IValue,tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    made/here/te_out.bin (No such file or directory)
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2501:0 Trace exploration spec path: made/here/te_out.tla
---*)
