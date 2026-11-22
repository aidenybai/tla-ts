(*---
description: -noTEBin leaves out the binary trace but still writes the spec.
ref: tlc2/TLC.java#handleParameters
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -generateSpecTE
  - -noTEBin
  - -teSpecOutDir
  - te_out.tla
files:
  - te_out.tla
  - te_out.bin
---*)
---- MODULE generate_without_bin ----
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
    2217:4 2: <Next line 22, col 9 to line 22, col 24 of module generate_without_bin>
    x = 1
    2217:4 3: <Next line 22, col 9 to line 22, col 24 of module generate_without_bin>
    x = 2
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2501:0 Trace exploration spec path: ./te_out.tla
  files:
    te_out.tla: |-
      ---- MODULE te_out ----
      EXTENDS Sequences, TLCExt, generate_without_bin, Toolbox, Naturals, TLC

      _expression ==
          LET generate_without_bin_TEExpression == INSTANCE generate_without_bin_TEExpression
          IN generate_without_bin_TEExpression!expression
      ----

      _trace ==
          LET generate_without_bin_TETrace == INSTANCE generate_without_bin_TETrace
          IN generate_without_bin_TETrace!trace
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

       Note that you can extract this module `generate_without_bin_TEExpression`
        to a dedicated file to reuse `expression` (the module in the 
        dedicated `generate_without_bin_TEExpression.tla` file takes precedence 
        over the module `generate_without_bin_TEExpression` below).

      ---- MODULE generate_without_bin_TEExpression ----
      EXTENDS Sequences, TLCExt, generate_without_bin, Toolbox, Naturals, TLC

      expression == 
          [
              \* To hide variables of the `generate_without_bin` spec from the error trace,
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
      \*---- MODULE generate_without_bin_TETrace ----
      \*EXTENDS IOUtils, generate_without_bin, TLC
      \*
      \*trace == IODeserialize("te_out.bin", TRUE)
      \*
      \*=============================================================================
      \*

      ---- MODULE generate_without_bin_TETrace ----
      EXTENDS generate_without_bin, TLC

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
    te_out.bin: null
---*)
