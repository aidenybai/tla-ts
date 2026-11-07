(*---
description: A trace spec path under an existing file can't be created, which TLC reports without changing the violation's exit status.
ref: tlc2/TraceExplorationSpec.java#generate
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -generateSpecTE
  - -teSpecOutDir
  - output_under_a_file.tla/te.tla
---*)
---- MODULE output_under_a_file ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == x < 1
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
    2217:4 2: <Next line 18, col 9 to line 18, col 24 of module output_under_a_file>
    x = 1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static final tlc2.value.IValue tlc2.module._TLCTrace.ioSerialize(tlc2.value.IValue,tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    output_under_a_file.tla/te.bin (Not a directory)
    2154:0 Attempted to apply the operator overridden by the Java method
    public static final tlc2.value.IValue tlc2.module._TLCTrace.ioSerialize(tlc2.value.IValue,tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    output_under_a_file.tla/te.bin (Not a directory)
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2502:0 Failed to generate trace exploration spec; error message: output_under_a_file.tla/te.tla (Not a directory)
---*)
