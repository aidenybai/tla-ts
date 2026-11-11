(*---
description: A TLCGet of an unset register in Init reports the undefined message in simulation.
ref: tlc2/tool/Simulator.java#getLocalValue
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
  - -depth
  - "1"
---*)
---- MODULE register_undefined_in_init ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = TLCGet(1)
Next == x' = x
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLCGetSet.TLCGetEval(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    2145:0 TLCGet(1) was undefined.
    2209:0 Progress(0) at <date>: 0 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 0
    Simulation using seed 4 and aril 0
---*)
