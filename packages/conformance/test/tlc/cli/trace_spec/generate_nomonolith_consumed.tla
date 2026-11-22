(*---
description: -generateSpecTE consumes a following 'nomonolith', which would otherwise be a second input file.
ref: tlc2/TLC.java#handleParameters
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -generateSpecTE
  - nomonolith
  - -teSpecOutDir
  - te_out.tla
files:
  - te_out.tla
  - te_out.bin
---*)
---- MODULE generate_nomonolith_consumed ----
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
    2217:4 2: <Next line 22, col 9 to line 22, col 24 of module generate_nomonolith_consumed>
    x = 1
    2217:4 3: <Next line 22, col 9 to line 22, col 24 of module generate_nomonolith_consumed>
    x = 2
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2501:0 Trace exploration spec path: ./te_out.tla
  files:
    te_out.tla: |-
      ---- MODULE te_out ----
      EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, generate_nomonolith_consumed

      _expression ==
          LET generate_nomonolith_consumed_TEExpression == INSTANCE generate_nomonolith_consumed_TEExpression
          IN generate_nomonolith_consumed_TEExpression!expression
      ----

      _trace ==
          LET generate_nomonolith_consumed_TETrace == INSTANCE generate_nomonolith_consumed_TETrace
          IN generate_nomonolith_consumed_TETrace!trace
      ----

      _inv ==
          ~(
              TLCGet("level") = Len(_TETrace)
              /\
              x = (2)
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
          \*         IN J!JsonSerialize("te_out.json", _TETrace)

      =============================================================================

       Note that you can extract this module `generate_nomonolith_consumed_TEExpression`
        to a dedicated file to reuse `expression` (the module in the 
        dedicated `generate_nomonolith_consumed_TEExpression.tla` file takes precedence 
        over the module `generate_nomonolith_consumed_TEExpression` below).

      ---- MODULE generate_nomonolith_consumed_TEExpression ----
      EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, generate_nomonolith_consumed

      expression == 
          [
              \* To hide variables of the `generate_nomonolith_consumed` spec from the error trace,
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
      \*---- MODULE generate_nomonolith_consumed_TETrace ----
      \*EXTENDS IOUtils, TLC, generate_nomonolith_consumed
      \*
      \*trace == IODeserialize("te_out.bin", TRUE)
      \*
      \*=============================================================================
      \*

      ---- MODULE generate_nomonolith_consumed_TETrace ----
      EXTENDS TLC, generate_nomonolith_consumed

      trace == 
          <<
          ([x |-> 0]),
          ([x |-> 1]),
          ([x |-> 2])
          >>
      ----


      =============================================================================

      ---- CONFIG te_out ----

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
    te_out.bin: |-
      values: 1
      [vars |-> {"x"}, counterexample |-> [state |-> {<<1, [x |-> 0]>>, <<2, [x |-> 1]>>, <<3, [x |-> 2]>>}, action |-> {<<<<1, [x |-> 0]>>, [name |-> "Next", location |-> [beginLine |-> 22, beginColumn |-> 9, endLine |-> 22, endColumn |-> 24, module |-> "generate_nomonolith_consumed"]], <<2, [x |-> 1]>>>>, <<<<2, [x |-> 1]>>, [name |-> "Next", location |-> [beginLine |-> 22, beginColumn |-> 9, endLine |-> 22, endColumn |-> 24, module |-> "generate_nomonolith_consumed"]], <<3, [x |-> 2]>>>>}]]
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
      "generate_nomonolith_consumed" loc -1
---*)
