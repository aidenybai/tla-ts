---- MODULE RandomOperator_TTrace_1793058655 ----
EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, RandomOperator

_expression ==
    LET RandomOperator_TEExpression == INSTANCE RandomOperator_TEExpression
    IN RandomOperator_TEExpression!expression
----

_trace ==
    LET RandomOperator_TETrace == INSTANCE RandomOperator_TETrace
    IN RandomOperator_TETrace!trace
----

_inv ==
    ~(
        TLCGet("level") = Len(_TETrace)
        /\
        zeta = (6)
        /\
        alpha = (41)
    )
----

_init ==
    /\ zeta = _TETrace[1].zeta
    /\ alpha = _TETrace[1].alpha
----

_next ==
    /\ \E i,j \in DOMAIN _TETrace:
        /\ \/ /\ j = i + 1
              /\ i = TLCGet("level")
        /\ zeta  = _TETrace[i].zeta
        /\ zeta' = _TETrace[j].zeta
        /\ alpha  = _TETrace[i].alpha
        /\ alpha' = _TETrace[j].alpha

\* Uncomment the ASSUME below to write the states of the error trace
\* to the given file in Json format. Note that you can pass any tuple
\* to `JsonSerialize`. For example, a sub-sequence of _TETrace.
    \* ASSUME
    \*     LET J == INSTANCE Json
    \*         IN J!JsonSerialize("RandomOperator_TTrace_1793058655.json", _TETrace)

=============================================================================

 Note that you can extract this module `RandomOperator_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `RandomOperator_TEExpression.tla` file takes precedence 
  over the module `RandomOperator_TEExpression` below).

---- MODULE RandomOperator_TEExpression ----
EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, RandomOperator

expression == 
    [
        \* To hide variables of the `RandomOperator` spec from the error trace,
        \* remove the variables below.  The trace will be written in the order
        \* of the fields of this record.
        zeta |-> zeta
        ,alpha |-> alpha
        
        \* Put additional constant-, state-, and action-level expressions here:
        \* ,_stateNumber |-> _TEPosition
        \* ,_zetaUnchanged |-> zeta = zeta'
        
        \* Format the `zeta` variable as Json value.
        \* ,_zetaJson |->
        \*     LET J == INSTANCE Json
        \*     IN J!ToJson(zeta)
        
        \* Lastly, you may build expressions over arbitrary sets of states by
        \* leveraging the _TETrace operator.  For example, this is how to
        \* count the number of times a spec variable changed up to the current
        \* state in the trace.
        \* ,_zetaModCount |->
        \*     LET F[s \in DOMAIN _TETrace] ==
        \*         IF s = 1 THEN 0
        \*         ELSE IF _TETrace[s].zeta # _TETrace[s-1].zeta
        \*             THEN 1 + F[s-1] ELSE F[s-1]
        \*     IN F[_TEPosition - 1]
    ]

=============================================================================



Parsing and semantic processing can take forever if the trace below is long.
 In this case, it is advised to uncomment the module below to deserialize the
 trace from a generated binary file.

\*
\*---- MODULE RandomOperator_TETrace ----
\*EXTENDS IOUtils, TLC, RandomOperator
\*
\*trace == IODeserialize("RandomOperator_TTrace_1793058655.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE RandomOperator_TETrace ----
EXTENDS TLC, RandomOperator

trace == 
    <<
    ([zeta |-> 0,alpha |-> 0]),
    ([zeta |-> 1,alpha |-> 32]),
    ([zeta |-> 2,alpha |-> 2]),
    ([zeta |-> 3,alpha |-> 84]),
    ([zeta |-> 4,alpha |-> 56]),
    ([zeta |-> 5,alpha |-> 28]),
    ([zeta |-> 6,alpha |-> 41])
    >>
----


=============================================================================

---- CONFIG RandomOperator_TTrace_1793058655 ----

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
\* Generated on Mon Oct 26 16:50:55 PDT 2026