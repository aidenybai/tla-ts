---- MODULE RandomSubsetNextTuples_TTrace_1793058861 ----
EXTENDS Sequences, RandomSubsetNextTuples, TLCExt, Toolbox, Naturals, TLC

_expression ==
    LET RandomSubsetNextTuples_TEExpression == INSTANCE RandomSubsetNextTuples_TEExpression
    IN RandomSubsetNextTuples_TEExpression!expression
----

_trace ==
    LET RandomSubsetNextTuples_TETrace == INSTANCE RandomSubsetNextTuples_TETrace
    IN RandomSubsetNextTuples_TETrace!trace
----

_inv ==
    ~(
        TLCGet("level") = Len(_TETrace)
        /\
        p = (<<131, 120, 98>>)
        /\
        q = (<<1503, 1800, 3698>>)
        /\
        y = (6)
    )
----

_init ==
    /\ p = _TETrace[1].p
    /\ q = _TETrace[1].q
    /\ y = _TETrace[1].y
----

_next ==
    /\ \E i,j \in DOMAIN _TETrace:
        /\ \/ /\ j = i + 1
              /\ i = TLCGet("level")
        /\ p  = _TETrace[i].p
        /\ p' = _TETrace[j].p
        /\ q  = _TETrace[i].q
        /\ q' = _TETrace[j].q
        /\ y  = _TETrace[i].y
        /\ y' = _TETrace[j].y

\* Uncomment the ASSUME below to write the states of the error trace
\* to the given file in Json format. Note that you can pass any tuple
\* to `JsonSerialize`. For example, a sub-sequence of _TETrace.
    \* ASSUME
    \*     LET J == INSTANCE Json
    \*         IN J!JsonSerialize("RandomSubsetNextTuples_TTrace_1793058861.json", _TETrace)

=============================================================================

 Note that you can extract this module `RandomSubsetNextTuples_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `RandomSubsetNextTuples_TEExpression.tla` file takes precedence 
  over the module `RandomSubsetNextTuples_TEExpression` below).

---- MODULE RandomSubsetNextTuples_TEExpression ----
EXTENDS Sequences, RandomSubsetNextTuples, TLCExt, Toolbox, Naturals, TLC

expression == 
    [
        \* To hide variables of the `RandomSubsetNextTuples` spec from the error trace,
        \* remove the variables below.  The trace will be written in the order
        \* of the fields of this record.
        p |-> p
        ,q |-> q
        ,y |-> y
        
        \* Put additional constant-, state-, and action-level expressions here:
        \* ,_stateNumber |-> _TEPosition
        \* ,_pUnchanged |-> p = p'
        
        \* Format the `p` variable as Json value.
        \* ,_pJson |->
        \*     LET J == INSTANCE Json
        \*     IN J!ToJson(p)
        
        \* Lastly, you may build expressions over arbitrary sets of states by
        \* leveraging the _TETrace operator.  For example, this is how to
        \* count the number of times a spec variable changed up to the current
        \* state in the trace.
        \* ,_pModCount |->
        \*     LET F[s \in DOMAIN _TETrace] ==
        \*         IF s = 1 THEN 0
        \*         ELSE IF _TETrace[s].p # _TETrace[s-1].p
        \*             THEN 1 + F[s-1] ELSE F[s-1]
        \*     IN F[_TEPosition - 1]
    ]

=============================================================================



Parsing and semantic processing can take forever if the trace below is long.
 In this case, it is advised to uncomment the module below to deserialize the
 trace from a generated binary file.

\*
\*---- MODULE RandomSubsetNextTuples_TETrace ----
\*EXTENDS IOUtils, RandomSubsetNextTuples, TLC
\*
\*trace == IODeserialize("RandomSubsetNextTuples_TTrace_1793058861.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE RandomSubsetNextTuples_TETrace ----
EXTENDS RandomSubsetNextTuples, TLC

trace == 
    <<
    ([p |-> <<22, 40, 6>>,q |-> <<792, 712, 1007>>,y |-> 0]),
    ([p |-> <<32, 2, 177>>,q |-> <<1478, 483, 1608>>,y |-> 1]),
    ([p |-> <<83, 131, 59>>,q |-> <<160, 3375, 3540>>,y |-> 2]),
    ([p |-> <<22, 196, 102>>,q |-> <<35, 3887, 1238>>,y |-> 3]),
    ([p |-> <<104, 182, 124>>,q |-> <<40, 3547, 3487>>,y |-> 4]),
    ([p |-> <<33, 40, 182>>,q |-> <<2379, 3649, 3433>>,y |-> 5]),
    ([p |-> <<131, 120, 98>>,q |-> <<1503, 1800, 3698>>,y |-> 6])
    >>
----


=============================================================================

---- CONFIG RandomSubsetNextTuples_TTrace_1793058861 ----

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
\* Generated on Mon Oct 26 16:54:22 PDT 2026