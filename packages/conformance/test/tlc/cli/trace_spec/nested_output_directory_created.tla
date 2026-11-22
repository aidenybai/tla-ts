(*---
description: The binary trace is written first and needs the folder to exist, so it fails with TLC_MODULE_VALUE_JAVA_METHOD_OVERRIDE, the spec's own writer then creates the folder, and the exit status stays that of the violation.
ref: tlc2/TraceExplorationSpec.java#generate
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -generateSpecTE
  - -teSpecOutDir
  - made/here/te_out.tla
files:
  - made/here/te_out.tla
  - made/here/te_out.bin
---*)
---- MODULE nested_output_directory_created ----
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
    2217:4 2: <Next line 21, col 9 to line 21, col 24 of module nested_output_directory_created>
    x = 1
    2217:4 3: <Next line 21, col 9 to line 21, col 24 of module nested_output_directory_created>
    x = 2
    2405:1 Evaluating postcondition _TLCTraceSilent at line 28, col 5 to line 28, col 21 of module _TLCTrace failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static final tlc2.value.IValue tlc2.module._TLCTrace.ioSerialize(tlc2.value.IValue,tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    made/here/te_out.bin (No such file or directory)
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2501:0 Trace exploration spec path: made/here/te_out.tla
  files:
    made/here/te_out.tla: |-
      ---- MODULE te_out ----
      EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, nested_output_directory_created

      _expression ==
          LET nested_output_directory_created_TEExpression == INSTANCE nested_output_directory_created_TEExpression
          IN nested_output_directory_created_TEExpression!expression
      ----

      _trace ==
          LET nested_output_directory_created_TETrace == INSTANCE nested_output_directory_created_TETrace
          IN nested_output_directory_created_TETrace!trace
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

       Note that you can extract this module `nested_output_directory_created_TEExpression`
        to a dedicated file to reuse `expression` (the module in the 
        dedicated `nested_output_directory_created_TEExpression.tla` file takes precedence 
        over the module `nested_output_directory_created_TEExpression` below).

      ---- MODULE nested_output_directory_created_TEExpression ----
      EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, nested_output_directory_created

      expression == 
          [
              \* To hide variables of the `nested_output_directory_created` spec from the error trace,
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
      \*---- MODULE nested_output_directory_created_TETrace ----
      \*EXTENDS IOUtils, TLC, nested_output_directory_created
      \*
      \*trace == IODeserialize("te_out.bin", TRUE)
      \*
      \*=============================================================================
      \*

      ---- MODULE nested_output_directory_created_TETrace ----
      EXTENDS TLC, nested_output_directory_created

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
    made/here/te_out.bin: null
---*)
