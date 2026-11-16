(*---
description: Ported from TLC's TSnapShotTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/TSnapShotTest.java
features:
  - tlc-regression
outcome: evaluation-failure
config: |-
  \* MV CONSTANT declarations
  CONSTANTS
  w1 = w1
  \* MV CONSTANT declarations
  CONSTANTS
  r1 = r1
  \* MV CONSTANT definitions
  CONSTANT
  Writer <- const_1446808092434108000
  \* MV CONSTANT definitions
  CONSTANT
  Reader <- const_1446808092444109000
  \* CONSTANT definition
  CONSTANT
  Nat <- def_ov_1446808092454110000
  \* CONSTRAINT definition
  CONSTRAINT
  constr_1446808092464111000
  \* SPECIFICATION definition
  SPECIFICATION
  spec_1446808092484113000
  \* INVARIANT definition
  INVARIANT
  inv_1446808092494114000
  \* Generated on Fri Nov 06 12:08:12 CET 2015
args:
  - -deadlock
includes:
  - TSnapShot.tla
---*)
---- MODULE MC ----
EXTENDS TSnapShot, TLC

\* MV CONSTANT declarations@modelParameterConstants
CONSTANTS
w1
----

\* MV CONSTANT declarations@modelParameterConstants
CONSTANTS
r1
----

\* MV CONSTANT definitions Writer
const_1446808092434108000 == 
{w1}
----

\* MV CONSTANT definitions Reader
const_1446808092444109000 == 
{r1}
----

\* CONSTANT definition @modelParameterDefinitions:0
def_ov_1446808092454110000 ==
0..2
----
\* CONSTRAINT definition @modelParameterContraint:0
constr_1446808092464111000 ==
LET maxNat == CHOOSE n \in Nat : \A m \in Nat : n >= m IN
\A w \in Writer : iwriter[w] < maxNat
----
\* Constant expression definition @modelExpressionEval
const_expr_1446808092474112000 == 
(w1 :> (w1 :> (w1 :> 0)) @@ r1 :> (w1 :> (w1 :> 0))) \in [Process -> [Writer -> Memory]]
----

\* Constant expression ASSUME statement @modelExpressionEval
ASSUME PrintT(<<"$!@$!@$!@$!@$!",const_expr_1446808092474112000>>)
----

\* SPECIFICATION definition @modelBehaviorSpec:0
spec_1446808092484113000 ==
Spec
----
\* INVARIANT definition @modelCorrectnessInvariants:0
inv_1446808092494114000 ==
TypeOK2
----
=============================================================================
\* Modification History
\* Created Fri Nov 06 12:08:12 CET 2015 by markus

(*--- recorded
all:
  exit: 76
  transcript: |-
    | <<"$!@$!@$!@$!@$!", TRUE>>
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2111:1 Evaluating invariant inv_1446808092494114000 failed.
    Attempted to check if 
    0
    which is not a TLC function value, is in the set of functions:
    {(w1 :> 0), (w1 :> 1), (w1 :> 2)}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ moved = (w1 :> (w1 :> FALSE) @@ r1 :> (w1 :> FALSE))
    /\ rwstate = (w1 :> (w1 :> 0) @@ r1 :> (w1 :> 0))
    /\ snap = (w1 :> (w1 :> 0))
    /\ rd1 = (w1 :> (w1 :> 0) @@ r1 :> (w1 :> 0))
    /\ rd2 = (w1 :> (w1 :> 0) @@ r1 :> (w1 :> 0))
    /\ wstate = (w1 :> "idle")
    /\ iwriter = (w1 :> 0)
    /\ view2 = (w1 :> (w1 :> (w1 :> 0)) @@ r1 :> (w1 :> (w1 :> 0)))
    /\ notRd1 = (w1 :> {w1} @@ r1 :> {w1})
    /\ notRd2 = (w1 :> {w1} @@ r1 :> {w1})
    /\ rstate = (r1 :> (w1 :> 0))
    /\ mem = (w1 :> 0)
    2217:4 2: <BeginRead(r1) line 99, col 17 to line 103, col 67 of module TSnapShot>
    /\ moved = (w1 :> (w1 :> FALSE) @@ r1 :> (w1 :> FALSE))
    /\ rwstate = (w1 :> (w1 :> 0) @@ r1 :> (w1 :> -1))
    /\ snap = (w1 :> (w1 :> 0))
    /\ rd1 = (w1 :> (w1 :> 0) @@ r1 :> (w1 :> 0))
    /\ rd2 = (w1 :> (w1 :> 0) @@ r1 :> (w1 :> 0))
    /\ wstate = (w1 :> "idle")
    /\ iwriter = (w1 :> 0)
    /\ view2 = (w1 :> (w1 :> (w1 :> 0)) @@ r1 :> (w1 :> (w1 :> 0)))
    /\ notRd1 = (w1 :> {w1} @@ r1 :> {w1})
    /\ notRd2 = (w1 :> {w1} @@ r1 :> {w1})
    /\ rstate = (r1 :> (w1 :> -1))
    /\ mem = (w1 :> 0)
    2217:4 3: <DoRd1(r1) line 107, col 13 to line 112, col 40 of module TSnapShot>
    /\ moved = (w1 :> (w1 :> FALSE) @@ r1 :> (w1 :> FALSE))
    /\ rwstate = (w1 :> (w1 :> 0) @@ r1 :> (w1 :> -1))
    /\ snap = (w1 :> (w1 :> 0))
    /\ rd1 = (w1 :> (w1 :> 0) @@ r1 :> (w1 :> 0))
    /\ rd2 = (w1 :> (w1 :> 0) @@ r1 :> (w1 :> 0))
    /\ wstate = (w1 :> "idle")
    /\ iwriter = (w1 :> 0)
    /\ view2 = (w1 :> (w1 :> (w1 :> 0)) @@ r1 :> (w1 :> (w1 :> 0)))
    /\ notRd1 = (w1 :> {w1} @@ r1 :> {})
    /\ notRd2 = (w1 :> {w1} @@ r1 :> {w1})
    /\ rstate = (r1 :> (w1 :> -1))
    /\ mem = (w1 :> 0)
    2217:4 4: <TryEnding(r1) line 121, col 17 to line 141, col 59 of module TSnapShot>
    /\ moved = (w1 :> (w1 :> FALSE) @@ r1 :> (w1 :> FALSE))
    /\ rwstate = (w1 :> (w1 :> 0) @@ r1 :> (w1 :> 0))
    /\ snap = (w1 :> (w1 :> 0))
    /\ rd1 = (w1 :> (w1 :> 0) @@ r1 :> (w1 :> 0))
    /\ rd2 = (w1 :> (w1 :> 0) @@ r1 :> (w1 :> 0))
    /\ wstate = (w1 :> "idle")
    /\ iwriter = (w1 :> 0)
    /\ view2 = (w1 :> (w1 :> (w1 :> 0)) @@ r1 :> (w1 :> 0))
    /\ notRd1 = (w1 :> {w1} @@ r1 :> {w1})
    /\ notRd2 = (w1 :> {w1} @@ r1 :> {w1})
    /\ rstate = (r1 :> (w1 :> 0))
    /\ mem = (w1 :> 0)
    2199:0 14 states generated, 10 distinct states found, 3 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
    2268:0 The average outdegree of the complete state graph is 2 (minimum is 1, the maximum 2 and the 95th percentile is 2).
---*)
