---- MODULE RandomSubset_TTrace_1793058785 ----
EXTENDS Sequences, TLCExt, RandomSubset, Toolbox, Naturals, TLC

_expression ==
    LET RandomSubset_TEExpression == INSTANCE RandomSubset_TEExpression
    IN RandomSubset_TEExpression!expression
----

_trace ==
    LET RandomSubset_TETrace == INSTANCE RandomSubset_TETrace
    IN RandomSubset_TETrace!trace
----

_inv ==
    ~(
        TLCGet("level") = Len(_TETrace)
        /\
        p = (<<104, 67, 48>>)
        /\
        q = (<<1756, 1519, 737>>)
        /\
        x = (13194)
        /\
        y = (100000002)
        /\
        z = (FALSE)
    )
----

_init ==
    /\ p = _TETrace[1].p
    /\ q = _TETrace[1].q
    /\ x = _TETrace[1].x
    /\ y = _TETrace[1].y
    /\ z = _TETrace[1].z
----

_next ==
    /\ \E i,j \in DOMAIN _TETrace:
        /\ \/ /\ j = i + 1
              /\ i = TLCGet("level")
        /\ p  = _TETrace[i].p
        /\ p' = _TETrace[j].p
        /\ q  = _TETrace[i].q
        /\ q' = _TETrace[j].q
        /\ x  = _TETrace[i].x
        /\ x' = _TETrace[j].x
        /\ y  = _TETrace[i].y
        /\ y' = _TETrace[j].y
        /\ z  = _TETrace[i].z
        /\ z' = _TETrace[j].z

\* Uncomment the ASSUME below to write the states of the error trace
\* to the given file in Json format. Note that you can pass any tuple
\* to `JsonSerialize`. For example, a sub-sequence of _TETrace.
    \* ASSUME
    \*     LET J == INSTANCE Json
    \*         IN J!JsonSerialize("RandomSubset_TTrace_1793058785.json", _TETrace)

=============================================================================

 Note that you can extract this module `RandomSubset_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `RandomSubset_TEExpression.tla` file takes precedence 
  over the module `RandomSubset_TEExpression` below).

---- MODULE RandomSubset_TEExpression ----
EXTENDS Sequences, TLCExt, RandomSubset, Toolbox, Naturals, TLC

expression == 
    [
        \* To hide variables of the `RandomSubset` spec from the error trace,
        \* remove the variables below.  The trace will be written in the order
        \* of the fields of this record.
        p |-> p
        ,q |-> q
        ,x |-> x
        ,y |-> y
        ,z |-> z
        
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
\*---- MODULE RandomSubset_TETrace ----
\*EXTENDS IOUtils, RandomSubset, TLC
\*
\*trace == IODeserialize("RandomSubset_TTrace_1793058785.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE RandomSubset_TETrace ----
EXTENDS RandomSubset, TLC

trace == 
    <<
    ([p |-> <<104, 67, 48>>,q |-> <<1756, 1519, 737>>,x |-> 13194,y |-> 100000002,z |-> TRUE]),
    ([p |-> <<104, 67, 48>>,q |-> <<1756, 1519, 737>>,x |-> 13194,y |-> 100000002,z |-> FALSE])
    >>
----


=============================================================================

---- CONFIG RandomSubset_TTrace_1793058785 ----

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
\* Generated on Mon Oct 26 16:53:05 PDT 2026