---- MODULE ConstantOperatorConfiguration_TTrace_1793058698 ----
EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, ConstantOperatorConfiguration

_expression ==
    LET ConstantOperatorConfiguration_TEExpression == INSTANCE ConstantOperatorConfiguration_TEExpression
    IN ConstantOperatorConfiguration_TEExpression!expression
----

_trace ==
    LET ConstantOperatorConfiguration_TETrace == INSTANCE ConstantOperatorConfiguration_TETrace
    IN ConstantOperatorConfiguration_TETrace!trace
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
    \*         IN J!JsonSerialize("ConstantOperatorConfiguration_TTrace_1793058698.json", _TETrace)

=============================================================================

 Note that you can extract this module `ConstantOperatorConfiguration_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `ConstantOperatorConfiguration_TEExpression.tla` file takes precedence 
  over the module `ConstantOperatorConfiguration_TEExpression` below).

---- MODULE ConstantOperatorConfiguration_TEExpression ----
EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, ConstantOperatorConfiguration

expression == 
    [
        \* To hide variables of the `ConstantOperatorConfiguration` spec from the error trace,
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
\*---- MODULE ConstantOperatorConfiguration_TETrace ----
\*EXTENDS IOUtils, TLC, ConstantOperatorConfiguration
\*
\*trace == IODeserialize("ConstantOperatorConfiguration_TTrace_1793058698.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE ConstantOperatorConfiguration_TETrace ----
EXTENDS TLC, ConstantOperatorConfiguration

trace == 
    <<
    ([x |-> 0]),
    ([x |-> 1]),
    ([x |-> 2])
    >>
----


=============================================================================

---- CONFIG ConstantOperatorConfiguration_TTrace_1793058698 ----
CONSTANTS
    F ( 0 ) = 1
    F ( 1 ) = 2
    F ( 2 ) = 2

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
\* Generated on Mon Oct 26 16:51:39 PDT 2026