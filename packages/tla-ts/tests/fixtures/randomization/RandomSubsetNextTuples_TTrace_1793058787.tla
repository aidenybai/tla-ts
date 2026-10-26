---- MODULE RandomSubsetNextTuples_TTrace_1793058787 ----
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
        p = (<<105, 11, 40>>)
        /\
        q = (<<1288, 2061, 2401>>)
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
    \*         IN J!JsonSerialize("RandomSubsetNextTuples_TTrace_1793058787.json", _TETrace)

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
\*trace == IODeserialize("RandomSubsetNextTuples_TTrace_1793058787.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE RandomSubsetNextTuples_TETrace ----
EXTENDS RandomSubsetNextTuples, TLC

trace == 
    <<
    ([p |-> <<66, 36, 77>>,q |-> <<73, 3977, 676>>,y |-> 0]),
    ([p |-> <<99, 34, 20>>,q |-> <<1319, 905, 1178>>,y |-> 1]),
    ([p |-> <<64, 84, 195>>,q |-> <<3247, 1060, 1536>>,y |-> 2]),
    ([p |-> <<68, 72, 51>>,q |-> <<3413, 2692, 1273>>,y |-> 3]),
    ([p |-> <<89, 199, 198>>,q |-> <<73, 819, 1420>>,y |-> 4]),
    ([p |-> <<14, 34, 107>>,q |-> <<429, 799, 2921>>,y |-> 5]),
    ([p |-> <<105, 11, 40>>,q |-> <<1288, 2061, 2401>>,y |-> 6])
    >>
----


=============================================================================

---- CONFIG RandomSubsetNextTuples_TTrace_1793058787 ----

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
\* Generated on Mon Oct 26 16:53:07 PDT 2026