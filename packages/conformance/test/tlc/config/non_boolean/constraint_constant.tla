(*---
description: A constraint defined as a constant non-Boolean makes processModelConstraints store the OpDefNode on the body, and evaluation then fails with a ClassCastException, reported on the initial state. This is an internal error rather than a message about the constraint.
ref: tlc2/tool/impl/SpecProcessor.java#processModelConstraints
features:
  - tlc-bug
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  CONSTRAINT I
---*)
---- MODULE constraint_constant ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
I == 3
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 class tla2sany.semantic.OpDefNode cannot be cast to class tlc2.value.impl.Value (tla2sany.semantic.OpDefNode and tlc2.value.impl.Value are in unnamed module of loader 'app')
    While working on the initial state:
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
    2199:0 1 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
