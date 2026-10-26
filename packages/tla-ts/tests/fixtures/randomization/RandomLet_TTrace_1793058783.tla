---- MODULE RandomLet_TTrace_1793058783 ----
EXTENDS Sequences, TLCExt, RandomLet, Toolbox, Naturals, TLC

_expression ==
    LET RandomLet_TEExpression == INSTANCE RandomLet_TEExpression
    IN RandomLet_TEExpression!expression
----

_trace ==
    LET RandomLet_TETrace == INSTANCE RandomLet_TETrace
    IN RandomLet_TETrace!trace
----

_inv ==
    ~(
        TLCGet("level") = Len(_TETrace)
        /\
        zeta = (6)
        /\
        alpha = (123)
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
    \*         IN J!JsonSerialize("RandomLet_TTrace_1793058783.json", _TETrace)

=============================================================================

 Note that you can extract this module `RandomLet_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `RandomLet_TEExpression.tla` file takes precedence 
  over the module `RandomLet_TEExpression` below).

---- MODULE RandomLet_TEExpression ----
EXTENDS Sequences, TLCExt, RandomLet, Toolbox, Naturals, TLC

expression == 
    [
        \* To hide variables of the `RandomLet` spec from the error trace,
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
\*---- MODULE RandomLet_TETrace ----
\*EXTENDS IOUtils, RandomLet, TLC
\*
\*trace == IODeserialize("RandomLet_TTrace_1793058783.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE RandomLet_TETrace ----
EXTENDS RandomLet, TLC

trace == 
    <<
    ([zeta |-> 0,alpha |-> 0]),
    ([zeta |-> 1,alpha |-> 161]),
    ([zeta |-> 2,alpha |-> 79]),
    ([zeta |-> 3,alpha |-> -12]),
    ([zeta |-> 4,alpha |-> 128]),
    ([zeta |-> 5,alpha |-> 86]),
    ([zeta |-> 6,alpha |-> 123])
    >>
----


=============================================================================

---- CONFIG RandomLet_TTrace_1793058783 ----

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
\* Generated on Mon Oct 26 16:53:04 PDT 2026