(*---
description: Ported from TLC's TLCGetNamedUndefinedTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/TLCGetNamedUndefinedTest.java
features:
  - tlc-regression
outcome: config-error
config: |
  CONSTANTS
  A <- diameter
  B <- distinct
  C <- queue
  D <- level
args:
  - -deadlock
---*)
------------------------ MODULE TLCGetNamedUndefined ------------------------
EXTENDS TLC

diameter == TLCGet("diameter")
distinct == TLCGet("distinct")
queue == TLCGet("queue")
level == TLCGet("level")

CONSTANT A,B,C,D

ASSUME(TRUE)

=============================================================================

(*--- recorded
all:
  exit: 151
  transcript: |-
    2281:1 The configuration file substitutes constant A with non-constant diameter - specifically:
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLCGetSet.TLCGetEval(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    2145:0 TLCGet(diameter) was undefined.
---*)
