---- MODULE te ----
EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, Records

_expression ==
    LET Records_TEExpression == INSTANCE Records_TEExpression
    IN Records_TEExpression!expression
----

_trace ==
    LET Records_TETrace == INSTANCE Records_TETrace
    IN Records_TETrace!trace
----

_inv ==
    ~(
        TLCGet("level") = Len(_TETrace)
        /\
        q = ([a |-> 1, b |-> 1])
        /\
        r = ([a |-> 1, b |-> 1])
        /\
        n = (2)
    )
----

_init ==
    /\ n = _TETrace[1].n
    /\ q = _TETrace[1].q
    /\ r = _TETrace[1].r
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

\* Uncomment the ASSUME below to write the states of the error trace
\* to the given file in Json format. Note that you can pass any tuple
\* to `JsonSerialize`. For example, a sub-sequence of _TETrace.
    \* ASSUME
    \*     LET J == INSTANCE Json
    \*         IN J!JsonSerialize("te.json", _TETrace)

=============================================================================

 Note that you can extract this module `Records_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `Records_TEExpression.tla` file takes precedence 
  over the module `Records_TEExpression` below).

---- MODULE Records_TEExpression ----
EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, Records

expression == 
    [
        \* To hide variables of the `Records` spec from the error trace,
        \* remove the variables below.  The trace will be written in the order
        \* of the fields of this record.
        n |-> n
        ,q |-> q
        ,r |-> r
        
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
\*---- MODULE Records_TETrace ----
\*EXTENDS IOUtils, TLC, Records
\*
\*trace == IODeserialize("te.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE Records_TETrace ----
EXTENDS TLC, Records

trace == 
    <<
    ([q |-> 0,r |-> [a |-> 0, b |-> 0],n |-> 0]),
    ([q |-> [a |-> 1, b |-> 1],r |-> [a |-> 0, b |-> 0],n |-> 1]),
    ([q |-> [a |-> 1, b |-> 1],r |-> [a |-> 1, b |-> 1],n |-> 2])
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
\* Generated on Tue Nov 24 13:20:24 PST 2026