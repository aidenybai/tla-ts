(*---
description: A FALSE guard prompts, and stdin's end fails the scanner.
ref: tlc2/module/TLCExt.java#pickSuccessor
features:
  - TLCExt
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  ACTION_CONSTRAINT Act
---*)
---- MODULE pick_action_false_no_stdin ----
EXTENDS TLCExt, TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Act == PickSuccessor(FALSE)
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    20000:0 Extend behavior of length 1 with a "Next" step [<Action line 16, col 9 to line 16, col 24 of module pick_action_false_no_stdin>]? (Yes/no/explored/states/diff):
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.TLCExt.pickSuccessor(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    No line found
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.TLCExt.pickSuccessor(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    No line found
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 24 of module pick_action_false_no_stdin>
    x = 1
    20000:0 Extend behavior of length 1 with a "Next" step [<Action line 16, col 9 to line 16, col 24 of module pick_action_false_no_stdin>]? (Yes/no/explored/states/diff):
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 8 to line 17, column 27 in pick_action_false_no_stdin
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
