(*---
description: After a violation with a trace of two or more states, TLC names the trace spec it wrote.
ref: tlc2/TraceExplorationSpec.java#generate
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -generateSpecTE
  - -teSpecOutDir
  - te.tla
files:
  - te.tla
  - te.bin
---*)
---- MODULE written_after_violation ----
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
    2217:4 2: <Next line 21, col 9 to line 21, col 24 of module written_after_violation>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2501:0 Trace exploration spec path: ./te.tla
  files:
    te.tla: |-
      ---- MODULE te ----
      EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, written_after_violation

      _expression ==
          LET written_after_violation_TEExpression == INSTANCE written_after_violation_TEExpression
          IN written_after_violation_TEExpression!expression
      ----

      _trace ==
          LET written_after_violation_TETrace == INSTANCE written_after_violation_TETrace
          IN written_after_violation_TETrace!trace
      ----

      _inv ==
          ~(
              TLCGet("level") = Len(_TETrace)
              /\
              x = (1)
          )
      ----

      _init ==
          /\ x = _TETrace[1].x
      ----

      _next ==
          /\ \E i,j \in DOMAIN _TETrace:
              /\ \/ /\ j = i + 1
                    /\ i = TLCGet("level")
              /\ x  = _TETrace[i].x
              /\ x' = _TETrace[j].x

      \* Uncomment the ASSUME below to write the states of the error trace
      \* to the given file in Json format. Note that you can pass any tuple
      \* to `JsonSerialize`. For example, a sub-sequence of _TETrace.
          \* ASSUME
          \*     LET J == INSTANCE Json
          \*         IN J!JsonSerialize("te.json", _TETrace)

      =============================================================================

       Note that you can extract this module `written_after_violation_TEExpression`
        to a dedicated file to reuse `expression` (the module in the 
        dedicated `written_after_violation_TEExpression.tla` file takes precedence 
        over the module `written_after_violation_TEExpression` below).

      ---- MODULE written_after_violation_TEExpression ----
      EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, written_after_violation

      expression == 
          [
              \* To hide variables of the `written_after_violation` spec from the error trace,
              \* remove the variables below.  The trace will be written in the order
              \* of the fields of this record.
              x |-> x
              
              \* Put additional constant-, state-, and action-level expressions here:
              \* ,_stateNumber |-> _TEPosition
              \* ,_xUnchanged |-> x = x'
              
              \* Format the `x` variable as Json value.
              \* ,_xJson |->
              \*     LET J == INSTANCE Json
              \*     IN J!ToJson(x)
              
              \* Lastly, you may build expressions over arbitrary sets of states by
              \* leveraging the _TETrace operator.  For example, this is how to
              \* count the number of times a spec variable changed up to the current
              \* state in the trace.
              \* ,_xModCount |->
              \*     LET F[s \in DOMAIN _TETrace] ==
              \*         IF s = 1 THEN 0
              \*         ELSE IF _TETrace[s].x # _TETrace[s-1].x
              \*             THEN 1 + F[s-1] ELSE F[s-1]
              \*     IN F[_TEPosition - 1]
          ]

      =============================================================================



      Parsing and semantic processing can take forever if the trace below is long.
       In this case, it is advised to uncomment the module below to deserialize the
       trace from a generated binary file.

      \*
      \*---- MODULE written_after_violation_TETrace ----
      \*EXTENDS IOUtils, TLC, written_after_violation
      \*
      \*trace == IODeserialize("te.bin", TRUE)
      \*
      \*=============================================================================
      \*

      ---- MODULE written_after_violation_TETrace ----
      EXTENDS TLC, written_after_violation

      trace == 
          <<
          ([x |-> 0]),
          ([x |-> 1])
          >>
      ----


      =============================================================================

      ---- CONFIG te ----

      INVARIANT
          _inv

      CHECK_DEADLOCK
          \* CHECK_DEADLOCK off because of PROPERTY or INVARIANT above.
          FALSE

      INIT
          _init

      NEXT
          _next

      CONSTANT
          _TETrace <- _trace

      ALIAS
          _expression
      =============================================================================
      \* Generated on <date>
    te.bin: |-
      values: 1
      [vars |-> {"x"}, counterexample |-> [state |-> {<<1, [x |-> 0]>>, <<2, [x |-> 1]>>}, action |-> {<<<<1, [x |-> 0]>>, [name |-> "Next", location |-> [beginLine |-> 21, beginColumn |-> 9, endLine |-> 21, endColumn |-> 24, module |-> "written_after_violation"]], <<2, [x |-> 1]>>>>}]]
      strings:
      "vars" loc -1
      "x" loc 0
      "counterexample" loc -1
      "state" loc -1
      "action" loc -1
      "name" loc -1
      "Next" loc -1
      "location" loc -1
      "beginLine" loc -1
      "beginColumn" loc -1
      "endLine" loc -1
      "endColumn" loc -1
      "module" loc -1
      "written_after_violation" loc -1
---*)
