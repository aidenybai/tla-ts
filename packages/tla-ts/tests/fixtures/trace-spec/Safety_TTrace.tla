---- MODULE te_out ----
EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, Safety, Safety_TEConstants

_expression ==
    LET Safety_TEExpression == INSTANCE Safety_TEExpression
    IN Safety_TEExpression!expression
----

_trace ==
    LET Safety_TETrace == INSTANCE Safety_TETrace
    IN Safety_TETrace!trace
----

_inv ==
    ~(
        TLCGet("level") = Len(_TETrace)
        /\
        zeta = ((p1 :> {0, 1} @@ p2 :> {}))
        /\
        x = (2)
        /\
        y = ("a")
    )
----

_init ==
    /\ zeta = _TETrace[1].zeta
    /\ x = _TETrace[1].x
    /\ y = _TETrace[1].y
----

_next ==
    /\ \E i,j \in DOMAIN _TETrace:
        /\ \/ /\ j = i + 1
              /\ i = TLCGet("level")
        /\ zeta  = _TETrace[i].zeta
        /\ zeta' = _TETrace[j].zeta
        /\ x  = _TETrace[i].x
        /\ x' = _TETrace[j].x
        /\ y  = _TETrace[i].y
        /\ y' = _TETrace[j].y

\* Uncomment the ASSUME below to write the states of the error trace
\* to the given file in Json format. Note that you can pass any tuple
\* to `JsonSerialize`. For example, a sub-sequence of _TETrace.
    \* ASSUME
    \*     LET J == INSTANCE Json
    \*         IN J!JsonSerialize("te_out.json", _TETrace)

=============================================================================

 Note that you can extract this module `Safety_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `Safety_TEExpression.tla` file takes precedence 
  over the module `Safety_TEExpression` below).

---- MODULE Safety_TEExpression ----
EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, Safety, Safety_TEConstants

expression == 
    [
        \* To hide variables of the `Safety` spec from the error trace,
        \* remove the variables below.  The trace will be written in the order
        \* of the fields of this record.
        zeta |-> zeta
        ,x |-> x
        ,y |-> y
        
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
\*---- MODULE Safety_TETrace ----
\*EXTENDS IOUtils, TLC, Safety, Safety_TEConstants
\*
\*trace == IODeserialize("te_out.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE Safety_TETrace ----
EXTENDS TLC, Safety, Safety_TEConstants

trace == 
    <<
    ([zeta |-> (p1 :> {} @@ p2 :> {}),x |-> 0,y |-> "a"]),
    ([zeta |-> (p1 :> {0} @@ p2 :> {}),x |-> 1,y |-> "a"]),
    ([zeta |-> (p1 :> {0, 1} @@ p2 :> {}),x |-> 2,y |-> "a"])
    >>
----


=============================================================================

---- MODULE Safety_TEConstants ----
EXTENDS Safety

CONSTANTS p1, p2

=============================================================================

---- CONFIG te_out ----
CONSTANTS
    N = 3
    P = { p1 , p2 }
    p1 = p1
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
\* Generated on Mon Nov 09 21:37:01 PST 2026