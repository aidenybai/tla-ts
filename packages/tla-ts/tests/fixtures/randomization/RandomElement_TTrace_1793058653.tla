---- MODULE RandomElement_TTrace_1793058653 ----
EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, RandomElement

_expression ==
    LET RandomElement_TEExpression == INSTANCE RandomElement_TEExpression
    IN RandomElement_TEExpression!expression
----

_trace ==
    LET RandomElement_TETrace == INSTANCE RandomElement_TETrace
    IN RandomElement_TETrace!trace
----

_inv ==
    ~(
        TLCGet("level") = Len(_TETrace)
        /\
        x = (140)
        /\
        y = (10)
    )
----

_init ==
    /\ x = _TETrace[1].x
    /\ y = _TETrace[1].y
----

_next ==
    /\ \E i,j \in DOMAIN _TETrace:
        /\ \/ /\ j = i + 1
              /\ i = TLCGet("level")
        /\ x  = _TETrace[i].x
        /\ x' = _TETrace[j].x
        /\ y  = _TETrace[i].y
        /\ y' = _TETrace[j].y

\* Uncomment the ASSUME below to write the states of the error trace
\* to the given file in Json format. Note that you can pass any tuple
\* to `JsonSerialize`. For example, a sub-sequence of _TETrace.
    \* ASSUME
    \*     LET J == INSTANCE Json
    \*         IN J!JsonSerialize("RandomElement_TTrace_1793058653.json", _TETrace)

=============================================================================

 Note that you can extract this module `RandomElement_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `RandomElement_TEExpression.tla` file takes precedence 
  over the module `RandomElement_TEExpression` below).

---- MODULE RandomElement_TEExpression ----
EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, RandomElement

expression == 
    [
        \* To hide variables of the `RandomElement` spec from the error trace,
        \* remove the variables below.  The trace will be written in the order
        \* of the fields of this record.
        x |-> x
        ,y |-> y
        
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
\*---- MODULE RandomElement_TETrace ----
\*EXTENDS IOUtils, TLC, RandomElement
\*
\*trace == IODeserialize("RandomElement_TTrace_1793058653.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE RandomElement_TETrace ----
EXTENDS TLC, RandomElement

trace == 
    <<
    ([x |-> 212,y |-> 0]),
    ([x |-> 384,y |-> 1]),
    ([x |-> 13,y |-> 2]),
    ([x |-> 644,y |-> 3]),
    ([x |-> 207,y |-> 4]),
    ([x |-> 852,y |-> 5]),
    ([x |-> 242,y |-> 6]),
    ([x |-> 336,y |-> 7]),
    ([x |-> 876,y |-> 8]),
    ([x |-> 759,y |-> 9]),
    ([x |-> 140,y |-> 10])
    >>
----


=============================================================================

---- CONFIG RandomElement_TTrace_1793058653 ----

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
\* Generated on Mon Oct 26 16:50:54 PDT 2026