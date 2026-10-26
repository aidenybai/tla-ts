---- MODULE RandomModelValue_TTrace_1793058858 ----
EXTENDS Sequences, TLCExt, RandomModelValue_TEConstants, Toolbox, Naturals, TLC, RandomModelValue

_expression ==
    LET RandomModelValue_TEExpression == INSTANCE RandomModelValue_TEExpression
    IN RandomModelValue_TEExpression!expression
----

_trace ==
    LET RandomModelValue_TETrace == INSTANCE RandomModelValue_TETrace
    IN RandomModelValue_TETrace!trace
----

_inv ==
    ~(
        TLCGet("level") = Len(_TETrace)
        /\
        owner = (p2)
        /\
        zeta = (6)
    )
----

_init ==
    /\ owner = _TETrace[1].owner
    /\ zeta = _TETrace[1].zeta
----

_next ==
    /\ \E i,j \in DOMAIN _TETrace:
        /\ \/ /\ j = i + 1
              /\ i = TLCGet("level")
        /\ owner  = _TETrace[i].owner
        /\ owner' = _TETrace[j].owner
        /\ zeta  = _TETrace[i].zeta
        /\ zeta' = _TETrace[j].zeta

\* Uncomment the ASSUME below to write the states of the error trace
\* to the given file in Json format. Note that you can pass any tuple
\* to `JsonSerialize`. For example, a sub-sequence of _TETrace.
    \* ASSUME
    \*     LET J == INSTANCE Json
    \*         IN J!JsonSerialize("RandomModelValue_TTrace_1793058858.json", _TETrace)

=============================================================================

 Note that you can extract this module `RandomModelValue_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `RandomModelValue_TEExpression.tla` file takes precedence 
  over the module `RandomModelValue_TEExpression` below).

---- MODULE RandomModelValue_TEExpression ----
EXTENDS Sequences, TLCExt, RandomModelValue_TEConstants, Toolbox, Naturals, TLC, RandomModelValue

expression == 
    [
        \* To hide variables of the `RandomModelValue` spec from the error trace,
        \* remove the variables below.  The trace will be written in the order
        \* of the fields of this record.
        owner |-> owner
        ,zeta |-> zeta
        
        \* Put additional constant-, state-, and action-level expressions here:
        \* ,_stateNumber |-> _TEPosition
        \* ,_ownerUnchanged |-> owner = owner'
        
        \* Format the `owner` variable as Json value.
        \* ,_ownerJson |->
        \*     LET J == INSTANCE Json
        \*     IN J!ToJson(owner)
        
        \* Lastly, you may build expressions over arbitrary sets of states by
        \* leveraging the _TETrace operator.  For example, this is how to
        \* count the number of times a spec variable changed up to the current
        \* state in the trace.
        \* ,_ownerModCount |->
        \*     LET F[s \in DOMAIN _TETrace] ==
        \*         IF s = 1 THEN 0
        \*         ELSE IF _TETrace[s].owner # _TETrace[s-1].owner
        \*             THEN 1 + F[s-1] ELSE F[s-1]
        \*     IN F[_TEPosition - 1]
    ]

=============================================================================



Parsing and semantic processing can take forever if the trace below is long.
 In this case, it is advised to uncomment the module below to deserialize the
 trace from a generated binary file.

\*
\*---- MODULE RandomModelValue_TETrace ----
\*EXTENDS IOUtils, RandomModelValue_TEConstants, TLC, RandomModelValue
\*
\*trace == IODeserialize("RandomModelValue_TTrace_1793058858.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE RandomModelValue_TETrace ----
EXTENDS RandomModelValue_TEConstants, TLC, RandomModelValue

trace == 
    <<
    ([owner |-> p1,zeta |-> 0]),
    ([owner |-> p2,zeta |-> 1]),
    ([owner |-> p2,zeta |-> 2]),
    ([owner |-> p1,zeta |-> 3]),
    ([owner |-> p2,zeta |-> 4]),
    ([owner |-> p3,zeta |-> 5]),
    ([owner |-> p2,zeta |-> 6])
    >>
----


=============================================================================

---- MODULE RandomModelValue_TEConstants ----
EXTENDS RandomModelValue

CONSTANTS p1, p2, p3

=============================================================================

---- CONFIG RandomModelValue_TTrace_1793058858 ----
CONSTANTS
    Proc = { p1 , p2 , p3 }
    p1 = p1
    p3 = p3
    p2 = p2

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
\* Generated on Mon Oct 26 16:54:18 PDT 2026