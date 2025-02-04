import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import { IoIosCart } from "react-icons/io";

function TopNav() {
  return (
    <Navbar className="bg-body-tertiary">
      <Container>
        <Navbar.Brand href="#home">
          {/* <img
            src="/logo.jpg"
            width="50"
            height="50"
            className="d-inline-block align-top"
            alt="React Bootstrap logo"
          /> */}
          Fairway Ink
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="#features">Start Designing</Nav.Link>
            <Nav.Link href="#pricing">Browse Items</Nav.Link>
          </Nav>
        </Navbar.Collapse>
        <Nav>
          <Nav.Link href="#deets">Login</Nav.Link>
          <Nav.Link eventKey={2} href="#memes">
            <IoIosCart />
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
}

export default TopNav;
