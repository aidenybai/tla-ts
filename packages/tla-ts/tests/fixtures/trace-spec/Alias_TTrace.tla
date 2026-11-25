---- MODULE te ----
EXTENDS Sequences, TLCExt, Alias, Toolbox, Naturals, TLC

_expression ==
    LET Alias_TEExpression == INSTANCE Alias_TEExpression
    IN Alias_TEExpression!expression
----

_trace ==
    LET Alias_TETrace == INSTANCE Alias_TETrace
    IN Alias_TETrace!trace
----

_inv ==
    ~(
        TLCGet("level") = Len(_TETrace)
        /\
        q = (<<[a |-> 1, b |-> 1], [a |-> 1, b |-> 1]>>)
        /\
        r = ([a |-> 2, b |-> 2])
        /\
        s = ([b |-> 2, a |-> 2])
        /\
        n = (3)
    )
----

_init ==
    /\ n = _TETrace[1].n
    /\ q = _TETrace[1].q
    /\ r = _TETrace[1].r
    /\ s = _TETrace[1].s
----

_next ==
    /\ \E i,j \in DOMAIN _TETrace:
        /\ \/ /\ j = i + 1
              /\ i = TLCGet("level")
        /\ n  = _TETrace[i].n
        /\ n' = _TETrace[j].n
        /\ q  = _TETrace[i].q
        /\ q' = _TETrace[j].q
        /\ r  = _TETrace[i].r
        /\ r' = _TETrace[j].r
        /\ s  = _TETrace[i].s
        /\ s' = _TETrace[j].s

\* Uncomment the ASSUME below to write the states of the error trace
\* to the given file in Json format. Note that you can pass any tuple
\* to `JsonSerialize`. For example, a sub-sequence of _TETrace.
    \* ASSUME
    \*     LET J == INSTANCE Json
    \*         IN J!JsonSerialize("te.json", _TETrace)

=============================================================================

 Note that you can extract this module `Alias_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `Alias_TEExpression.tla` file takes precedence 
  over the module `Alias_TEExpression` below).

---- MODULE Alias_TEExpression ----
EXTENDS Sequences, TLCExt, Alias, Toolbox, Naturals, TLC

expression == 
    [
        \* To hide variables of the `Alias` spec from the error trace,
        \* remove the variables below.  The trace will be written in the order
        \* of the fields of this record.
        n |-> n
        ,q |-> q
        ,r |-> r
        ,s |-> s
        
        \* Put additional constant-, state-, and action-level expressions here:
        \* ,_stateNumber |-> _TEPosition
        \* ,_nUnchanged |-> n = n'
        
        \* Format the `n` variable as Json value.
        \* ,_nJson |->
        \*     LET J == INSTANCE Json
        \*     IN J!ToJson(n)
        
        \* Lastly, you may build expressions over arbitrary sets of states by
        \* leveraging the _TETrace operator.  For example, this is how to
        \* count the number of times a spec variable changed up to the current
        \* state in the trace.
        \* ,_nModCount |->
        \*     LET F[s \in DOMAIN _TETrace] ==
        \*         IF s = 1 THEN 0
        \*         ELSE IF _TETrace[s].n # _TETrace[s-1].n
        \*             THEN 1 + F[s-1] ELSE F[s-1]
        \*     IN F[_TEPosition - 1]
    ]

=============================================================================



Parsing and semantic processing can take forever if the trace below is long.
 In this case, it is advised to uncomment the module below to deserialize the
 trace from a generated binary file.

\*
\*---- MODULE Alias_TETrace ----
\*EXTENDS IOUtils, Alias, TLC
\*
\*trace == IODeserialize("te.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE Alias_TETrace ----
EXTENDS Alias, TLC

trace == 
    <<
    ([q |-> <<>>,r |-> [a |-> 0, b |-> 0],s |-> [a |-> 0, b |-> 0],n |-> 0]),
    ([q |-> <<[a |-> 0, b |-> 0], [a |-> 0, b |-> 0]>>,r |-> [a |-> 0, b |-> 0],s |-> [b |-> 0, a |-> 0],n |-> 1]),
    ([q |-> <<[a |-> 0, b |-> 0], [a |-> 0, b |-> 0]>>,r |-> [a |-> 1, b |-> 1],s |-> [b |-> 1, a |-> 1],n |-> 2]),
    ([q |-> <<[a |-> 1, b |-> 1], [a |-> 1, b |-> 1]>>,r |-> [a |-> 2, b |-> 2],s |-> [b |-> 2, a |-> 2],n |-> 3])
    >>
----


=============================================================================

---- CONFIG te ----

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
\* Generated on Tue Nov 24 14:15:56 PST 2026