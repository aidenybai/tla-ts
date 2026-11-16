(*---
description: "_POSSIBLE under -dfid fails on the first state, because its tracking reads named registers from BFS workers that -dfid never creates. This is a TLC bug: TLCGetOrDefault dereferences a null worker."
features: [tlc-bug]
ref: tlc2/tool/impl/SpecProcessor.java#processConfigPossible
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  _POSSIBLE Pred
args:
  - -dfid
  - "4"
correct:
  all:
    exit: 0
    transcript: |-
      2208:0 Finished computing initial states: 1 states generated, with 1 of them distinct.
      2205:0 Starting level 2: 1 states generated, 1 distinct states found.
      2205:0 Starting level 3: 2 states generated, 2 distinct states found.
      2205:0 Starting level 4: 4 states generated, 3 distinct states found.
      2206:0 Progress(-1) at <date>: 7 states generated, 3 distinct states found, -1 states left on queue.
      2204:0 7 states generated, 3 distinct states found.
---*)
---- MODULE in_dfid ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Pred == x = 9
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    x = 0
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLCExt.tlcGetOrDefault(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot invoke "tlc2.util.IdThread.getNamedRegister(util.UniqueString)" because "this.workers[i]" is null
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    tlc2.tool.impl.FastTool@<id>
    2206:0 Progress(-1) at <date>: 1 states generated, 0 distinct states found, -1 states left on queue.
    2204:0 1 states generated, 0 distinct states found.
---*)
