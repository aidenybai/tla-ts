---- MODULE SymmetricLiveness_TTrace_1793058711 ----
EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, SymmetricLiveness

_expression ==
    LET SymmetricLiveness_TEExpression == INSTANCE SymmetricLiveness_TEExpression
    IN SymmetricLiveness_TEExpression!expression
----

_trace ==
    LET SymmetricLiveness_TETrace == INSTANCE SymmetricLiveness_TETrace
    IN SymmetricLiveness_TETrace!trace
----

_prop ==
    ~<>[](
        x = (m1)
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
    \*         IN J!JsonSerialize("SymmetricLiveness_TTrace_1793058711.json", _TETrace)

=============================================================================

 Note that you can extract this module `SymmetricLiveness_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `SymmetricLiveness_TEExpression.tla` file takes precedence 
  over the module `SymmetricLiveness_TEExpression` below).

---- MODULE SymmetricLiveness_TEExpression ----
EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, SymmetricLiveness

expression == 
    [
        \* To hide variables of the `SymmetricLiveness` spec from the error trace,
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
\*---- MODULE SymmetricLiveness_TETrace ----
\*EXTENDS IOUtils, TLC, SymmetricLiveness
\*
\*trace == IODeserialize("SymmetricLiveness_TTrace_1793058711.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE SymmetricLiveness_TETrace ----
EXTENDS TLC, SymmetricLiveness

trace == 
    <<
    ([x |-> m1])
    >>
----


=============================================================================

---- CONFIG SymmetricLiveness_TTrace_1793058711 ----
CONSTANTS
    m1 = m1
    m2 = m2
    m1 = m1
    m2 = m2

PROPERTY
    _prop

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
\* Generated on Mon Oct 26 16:51:51 PDT 2026