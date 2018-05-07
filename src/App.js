import React, { Component } from 'react';
import { Table, Icon, Button, Avatar } from 'graphene-ui';
import moment from 'moment'

class App extends Component {
	state = {
		loading: true,
		stories: [],
		error: null
	};
	getRandomNumbers(arr) {
		const randomArray = [];
		let nums = 10;
		while (nums > 0) {
			randomArray.push(arr[Math.floor(Math.random() * arr.length)]);
			nums--;
		}
		return randomArray;
	}
	fetchData = async() =>{
    this.setState({loading: true})
		try {
			//fetch story ids
			let storyIds = await fetch(
				'https://hacker-news.firebaseio.com/v0/topstories.json'
			);
			storyIds = await storyIds.json();
			//pick  10 random stories
			const randomIndexes = this.getRandomNumbers(storyIds);
			//get story data for each random id in parallel and wait for all to resolve
			let items = await Promise.all(
				randomIndexes.map(async index => {
					let item = await fetch(
						`https://hacker-news.firebaseio.com/v0/item/${index}.json`
					);
					if (item.status !== 200) {
						throw new Error('Error fetching story data');
					}
					item = await item.json();
					return item;
				})
			);
			//get author data for each story in parallel and wait for all to resolve
			await Promise.all(
				items.map(async item => {
					const author = await fetch(
						`https://hacker-news.firebaseio.com/v0/user/${item.by}.json`
					);
					if (author.status !== 200) {
						throw new Error('Error fetching author data');
					}
					item.author = await author.json();
					return author;
				})
			);
			//sort data by score
			items.sort((a, b) => a.score - b.score);
			setTimeout(() => this.setState({ stories: items, loading: false }), 250);
		} catch (error) {
			this.setState({ error: error.message });
		}
	}
	componentDidMount() {
		this.fetchData();
	}
	render() {
		const { stories, loading, error } = this.state;
		if (error) return error;
		return (
			<div>
        <Button icon="download" style={{margin: '15px'}} onClick={this.fetchData}>Refresh</Button>
        {loading ? (
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '572px'}}>...loading</div>
        ) : (
          <Table>
  					<Table.Header>
  						<Table.HeaderCell style={{ width: '550px' }}>
  							Story Title
  						</Table.HeaderCell>
  						<Table.HeaderCell>Created</Table.HeaderCell>
  						<Table.HeaderCell>Author</Table.HeaderCell>
  						<Table.HeaderCell style={{ width: '60px' }}>Link</Table.HeaderCell>
  					</Table.Header>
  					<Table.Body>
  						{stories.map(story => (
  							<Table.Row>
  								<Table.Cell style={{ width: '550px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
  									<p>{story.title}</p>
                    <div style={{marginRight: '40px', padding: '5px', background: "#6bada7", color: 'white', borderRadius: '8px', minWidth: '20px', textAlign: 'center'}}>{story.score}</div>
  								</Table.Cell>
  								<Table.Cell>{moment.unix(story.time).format('ddd MM YYYY')}</Table.Cell>
  								<Table.Cell>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                      <Avatar size="mini"/>
                      <p style={{marginLeft: '20px'}}>{story.author.id}</p>
                      <div style={{margin: '10px', padding: '5px', background: "#6bada7", color: 'white', borderRadius: '8px'}}>{story.author.karma}</div>
                    </div>
                  </Table.Cell>
  								<Table.Cell style={{ width: '60px' }}>
  									{story.url && <a target="_blank" href={story.url}><Icon name="link" /></a>}
  								</Table.Cell>
  							</Table.Row>
  						))}
  					</Table.Body>
  				</Table>
        )}
			</div>
		);
	}
}

export default App;
